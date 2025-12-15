/* eslint-disable @next/next/no-page-custom-font */
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Alberto Rota",
  description: "Research, open-source, and selected projects by Alberto Rota.",
  icons: {
    icon: [{ url: "/AR.png", type: "image/png" }],
    shortcut: [{ url: "/AR.png", type: "image/png" }],
    apple: [{ url: "/AR.png", type: "image/png" }],
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        {/* BBH fonts are available on Google Fonts, but not supported by `next/font/google`'s internal font list. */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=BBH+Bartle&family=BBH+Bogle&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
