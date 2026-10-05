// Enquanto a página de atacado não existe,
// o menu aponta para as seções da página inicial.
export const menuPrincipal = [
  { rotulo: "Início", href: "/" },
  { rotulo: "Produtos", href: "/produtos" },
  { rotulo: "Personalização", href: "/personalizacao" },
  { rotulo: "Atacado", href: "/#atacado" },
] as const;
