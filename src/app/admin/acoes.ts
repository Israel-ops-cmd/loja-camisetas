"use server";

import { listarArquivosEsquecidos } from "@/lib/arquivos-esquecidos";
import { formatarTamanhoDoArquivo } from "@/lib/personalizacao-regras";
import { administradorDaAcao, SEM_PERMISSAO } from "@/lib/painel";
import { criarClienteSupabase } from "@/lib/supabase/servidor";

// Manutenção do painel. Apagar usa a sessão do administrador (as regras do
// Storage só deixam administrador apagar); o site não guarda chave secreta.

type Falha = { ok: false; erro: string };

/** Quantos arquivos esquecidos existem e quanto espaço ocupam. */
export async function contarArquivosEsquecidos(): Promise<{ ok: true; quantidade: number; tamanho: string } | Falha> {
  if (!(await administradorDaAcao())) return { ok: false, erro: SEM_PERMISSAO };
  const arquivos = await listarArquivosEsquecidos();
  return {
    ok: true,
    quantidade: arquivos.length,
    tamanho: formatarTamanhoDoArquivo(arquivos.reduce((soma, a) => soma + a.bytes, 0)),
  };
}

/** Apaga os arquivos esquecidos (a lista é refeita aqui, na hora). */
export async function apagarArquivosEsquecidos(): Promise<{ ok: true; mensagem: string } | Falha> {
  if (!(await administradorDaAcao())) return { ok: false, erro: SEM_PERMISSAO };
  const arquivos = await listarArquivosEsquecidos();
  if (arquivos.length === 0) return { ok: true, mensagem: "Nenhum arquivo esquecido. Nada foi apagado." };

  const supabase = await criarClienteSupabase();
  let apagados = 0;
  let bytes = 0;
  const pastas = [...new Set(arquivos.map((a) => a.pasta))];
  for (const pasta of pastas) {
    const daPasta = arquivos.filter((a) => a.pasta === pasta);
    for (let i = 0; i < daPasta.length; i += 100) {
      const lote = daPasta.slice(i, i + 100);
      const { data, error } = await supabase.storage.from(pasta).remove(lote.map((a) => a.caminho));
      if (error) {
        console.error(`[arquivos esquecidos] erro ao apagar em ${pasta}:`, error.message);
        continue;
      }
      const apagadosAgora = new Set(data.map((d) => d.name));
      apagados += apagadosAgora.size;
      bytes += lote.filter((a) => apagadosAgora.has(a.caminho)).reduce((soma, a) => soma + a.bytes, 0);
    }
  }

  if (apagados < arquivos.length) {
    return {
      ok: false,
      erro: `Apagamos ${apagados} de ${arquivos.length} arquivos. Tente de novo em instantes; se continuar, avise quem cuida do site.`,
    };
  }
  return {
    ok: true,
    mensagem: `${apagados === 1 ? "1 arquivo apagado" : `${apagados} arquivos apagados`}, ${formatarTamanhoDoArquivo(bytes)} liberados.`,
  };
}
