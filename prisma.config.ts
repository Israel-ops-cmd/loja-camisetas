import { config } from "dotenv";
import { defineConfig } from "prisma/config";

// O CLI do Prisma não lê o .env.local sozinho (o Next.js lê, o Prisma não).
config({ path: ".env.local", quiet: true });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // Migrations usam a conexão direta; o pooler (DATABASE_URL) fica para a aplicação.
    url: process.env["DIRECT_URL"],
  },
});
