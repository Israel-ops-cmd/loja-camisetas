import Link from "next/link";

import { FormularioModelo } from "@/components/admin/FormularioModelo";
import { Painel } from "@/components/ui/Painel";
import { exigirAdministrador } from "@/lib/auth";

export default async function PaginaNovoModelo() {
  await exigirAdministrador();

  return (
    <div className="secao">
      <div className="mx-auto max-w-3xl">
        <p className="sobretitulo text-secundario">
          <Link href="/admin/modelos" className="hover:text-tinta">Modelos</Link>
        </p>
        <h1 className="titulo-destaque mt-4">Modelo novo</h1>
        <p className="mt-4 text-[16px] text-apoio">
          Primeiro o nome e o pacote. Na próxima tela você escolhe as cores, os tamanhos e a tabela de medidas.
        </p>
        <div className="mt-8">
          <Painel titulo="Dados do modelo">
            <FormularioModelo
              id={null}
              valores={{
                nome: "",
                ativo: true,
                pesoEmGramas: "300",
                larguraCm: "22",
                alturaCm: "4",
                comprimentoCm: "28",
                precoEstampada: "",
                precoLisa: "",
              }}
            />
          </Painel>
        </div>
      </div>
    </div>
  );
}
