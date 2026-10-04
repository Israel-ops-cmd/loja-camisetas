import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { configuracaoSupabase } from "@/lib/supabase/config";

/** Áreas que exigem login. A conferência definitiva fica nas páginas. */
const AREAS_PROTEGIDAS = ["/conta", "/admin", "/checkout", "/pedidos"];

export async function proxy(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  // Se o link do e-mail cair na raiz (redirecionamento não autorizado no
  // Supabase volta para a Site URL), encaminha o código para a rota certa.
  if (pathname === "/" && searchParams.has("code")) {
    const destino = request.nextUrl.clone();
    destino.pathname = "/auth/callback";
    return NextResponse.redirect(destino);
  }

  let resposta = NextResponse.next({ request });

  const { url, chave } = configuracaoSupabase();
  const supabase = createServerClient(url, chave, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesParaGravar, cabecalhos) {
        // A sessão renovada vai para a requisição (as páginas leem) e para a
        // resposta (o navegador guarda).
        for (const { name, value } of cookiesParaGravar) {
          request.cookies.set(name, value);
        }
        resposta = NextResponse.next({ request });
        for (const { name, value, options } of cookiesParaGravar) {
          resposta.cookies.set(name, value, options);
        }
        for (const [nome, valor] of Object.entries(cabecalhos ?? {})) {
          resposta.headers.set(nome, valor);
        }
      },
    },
  });

  // Renova a sessão quando necessário. É o que mantém o cliente logado.
  // Não coloque código entre a criação do cliente e esta chamada.
  const { data } = await supabase.auth.getClaims();
  const logado = !!data?.claims;

  const protegida = AREAS_PROTEGIDAS.some(
    (area) => pathname === area || pathname.startsWith(`${area}/`),
  );
  if (protegida && !logado) {
    const entrar = request.nextUrl.clone();
    entrar.pathname = "/entrar";
    entrar.search = `?voltar=${encodeURIComponent(pathname)}`;
    return NextResponse.redirect(entrar);
  }

  return resposta;
}

export const config = {
  matcher: [
    // Tudo, menos arquivos do Next, imagens otimizadas, fotos e ícones.
    "/((?!_next/static|_next/image|fotos/|icon.svg|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico)$).*)",
  ],
};
