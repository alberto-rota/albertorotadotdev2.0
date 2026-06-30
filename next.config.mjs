/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "raw.githubusercontent.com",
      },
    ],
  },
  async redirects() {
    return [
      {
        source: "/CV_Alberto_Rota.pdf",
        destination: "/pdfs/CV_Alberto_Rota.pdf",
        permanent: true,
      },
      {
        source: "/citations/:slug.txt",
        destination: "/bibtex/:slug.bib",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
