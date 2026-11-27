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
  // albertorota.dev/openshot serves the OpenShot site (Vercel project "openshot") without leaving this domain.
  // beforeFiles so it wins over the [section] route.
  async rewrites() {
    return {
      beforeFiles: [
        { source: "/openshot", destination: "https://openshot-eight.vercel.app/openshot" },
        { source: "/openshot/:path*", destination: "https://openshot-eight.vercel.app/openshot/:path*" },
      ],
    };
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
        source: "/vsc-extensions/:slug",
        destination: "/workshop/:slug",
        permanent: true,
      },
      // Terminal Tools + Things I Build were merged into The Workshop.
      { source: "/terminal-tools", destination: "/#workshop", permanent: true },
      { source: "/terminal-tools/:slug", destination: "/workshop/:slug", permanent: true },
      { source: "/builds", destination: "/#workshop", permanent: true },
      { source: "/builds/:slug", destination: "/workshop/:slug", permanent: true },
      {
        source: "/research/hamlynworkshop",
        destination: "/research/robotic-colonoscopy",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
