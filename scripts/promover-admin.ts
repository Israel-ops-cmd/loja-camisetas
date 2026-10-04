// Marca (ou desmarca) uma conta como administradora.
//
//   npm run admin:promover -- email@exemplo.com
//   npm run admin:promover -- email@exemplo.com --remover
//
// A pessoa precisa ter criado a conta em /cadastro e confirmado o e-mail.
// O papel fica em app_metadata, que o cliente não consegue alterar.
// Vale a partir do próximo login (ou da próxima renovação da sessão).

import { config } from "dotenv";
import { Client } from "pg";

config({ path: ".env.local", quiet: true });

async function main() {
  const argumentos = process.argv.slice(2);
  const remover = argumentos.includes("--remover");
  const email = argumentos.find((a) => !a.startsWith("--"))?.trim().toLowerCase();

  if (!email || !email.includes("@")) {
    console.error("Uso: npm run admin:promover -- email@exemplo.com [--remover]");
    process.exitCode = 1;
    return;
  }

  const banco = new Client({ connectionString: process.env.DIRECT_URL });
  await banco.connect();
  try {
    const { rows } = await banco.query<{
      email: string;
      confirmado: boolean;
    }>(
      `update auth.users
          set raw_app_meta_data = case
                when $2 then coalesce(raw_app_meta_data, '{}'::jsonb) - 'papel'
                else coalesce(raw_app_meta_data, '{}'::jsonb) || '{"papel": "admin"}'::jsonb
              end
        where lower(email) = $1
        returning email, email_confirmed_at is not null as confirmado`,
      [email, remover],
    );

    if (rows.length === 0) {
      console.error(`Nenhuma conta com o e-mail ${email}. Crie a conta em /cadastro primeiro.`);
      process.exitCode = 1;
      return;
    }

    console.log(
      remover
        ? `${rows[0].email} não é mais administrador.`
        : `${rows[0].email} agora é administrador.`,
    );
    if (!rows[0].confirmado) {
      console.log("Atenção: o e-mail dessa conta ainda não foi confirmado.");
    }
    console.log("Para valer, saia e entre de novo na loja.");
  } finally {
    await banco.end();
  }
}

main().catch((erro) => {
  console.error("Erro:", erro.message);
  process.exitCode = 1;
});
