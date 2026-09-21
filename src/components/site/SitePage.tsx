"use client";

import * as React from "react";
import { Nav } from "./Nav";
import { Hero } from "./Hero";
import { Announcements } from "./Announcement";
import { Section } from "./Section";
import { DetailPanel } from "./DetailPanel";
import { Contact } from "./Contact";
import { CustomScrollbar } from "./CustomScrollbar";
import { bySection, orderedSections, SECTION_FALLBACK_TITLES, loadSiteData } from "./data";
import type { Product } from "./types";

const data = loadSiteData();
const grouped = bySection(data.products);
const order = orderedSections(data.sections);
const pinned = data.products.filter((p) => p.pinned && p.link && p.link !== "#");
const pinnedContacts = data.contacts.filter((c) => c.pinned && c.href);

export function SitePage() {
  const [active, setActive] = React.useState<Product | null>(null);

  React.useEffect(() => {
    const applyHash = () => {
      const hash = window.location.hash.replace(/^#/, "");
      if (!hash) return;
      const product = data.products.find((p) => p.slug === hash);
      if (product) {
        setActive(product);
        return;
      }
      const el = document.getElementById(hash);
      if (!el) return;
      const offset = 96;
      const top = el.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
    };
    applyHash();
    window.addEventListener("hashchange", applyHash);
    return () => window.removeEventListener("hashchange", applyHash);
  }, []);

  return (
    <>
      <CustomScrollbar />
      <Nav />
      <Hero tagline={data.hero?.tagline} pinned={pinned} contacts={pinnedContacts} />
      <Announcements items={data.announcements} />

      <main>
        {order
          .filter((id) => id !== "resources")
          .map((id) => {
            const cfg = data.sections[id] ?? {};
            const items = grouped[id];
            return (
              <Section
                key={id}
                id={id}
                title={cfg.title ?? SECTION_FALLBACK_TITLES[id]}
                subtitle={cfg.subtitle}
                products={items}
                layout={cfg.layout}
                cardAspect={cfg.cardAspect}
                cardFit={cfg.cardFit}
                cardInset={cfg.cardInset}
                maxWidth={cfg.maxWidth}
                onOpenDetail={setActive}
              />
            );
          })}

        <Contact profiles={grouped.resources} />
      </main>

      <DetailPanel product={active} onClose={() => setActive(null)} />
    </>
  );
}
