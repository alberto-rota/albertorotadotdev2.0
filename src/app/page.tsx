import { SitePage } from "@/components/site/SitePage";
import { JsonLd } from "@/components/site/JsonLd";
import { websiteSchema } from "@/lib/schema";
import { SITE_DESCRIPTION, SITE_TITLE } from "@/lib/site";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { absolute: SITE_TITLE },
  description: SITE_DESCRIPTION,
  alternates: { canonical: "/" },
  robots: { index: true, follow: true },
};

export default function Home() {
  return (
    <>
      <JsonLd data={websiteSchema()} />
      <SitePage />
    </>
  );
}
