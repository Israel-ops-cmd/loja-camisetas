import type { NextConfig } from "next";

// Fotos de produto enviadas pelo painel ficam na pasta pública "produtos" do
// Supabase Storage. Só esse caminho é liberado para o otimizador de imagens.
const supabase = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).origin
  : null;

const nextConfig: NextConfig = {
  images: {
    remotePatterns: supabase
      ? [new URL(`${supabase}/storage/v1/object/public/produtos/**`)]
      : [],
  },
};

export default nextConfig;
