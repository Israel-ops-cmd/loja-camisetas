import type { Metadata } from "next";

import { NavegacaoDoPainel } from "@/components/admin/NavegacaoDoPainel";
import { exigirAdministrador } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Painel",
  robots: { index: false, follow: false },
};

/**
 * Todo o /admin passa por aqui. Cada página e Server Action do painel deve
 * chamar `exigirAdministrador()` de novo: o layout não protege ações.
 */
export default async function LayoutAdmin({ children }: LayoutProps<"/admin">) {
  await exigirAdministrador();
  return (
    <>
      <NavegacaoDoPainel />
      {children}
    </>
  );
}
