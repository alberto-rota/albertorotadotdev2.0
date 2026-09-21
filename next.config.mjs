/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "raw.githubusercontent.com",
      },
    ],
  },
  async headers() {
    if (process.env.NODE_ENV !== "production") return [];
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
        ],
      },
    ];
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
      {
        source: "/research/hamlynworkshop",
        destination: "/research/robotic-colonoscopy",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
