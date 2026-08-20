import HeroParallaxDemo from "@/components/hero-parallax-demo";

export default function Home() {
  return (
    <main>
      <HeroParallaxDemo />

      <section id="contact" aria-label="Get In Contact" className="relative w-full">
        <div className="w-full px-4 pb-20 pt-14">
          <div className="mb-10">
            <span className="text-3xl sm:text-5xl font-extrabold text-black dark:text-white">
              Get In Touch
            </span>

          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <ContactItem
              label="Personal "
              value="alberto_rota@outlook.com"
              href="mailto:alberto_rota@outlook.com"
            />
            <ContactItem
              label="Academic"
              value="alberto1.rota@polimi.ti"
              href="mailto:alberto1.rota@polimi.ti"
            />
            <ContactItem label="Current location" value="Milan, Italy" />
          </div>
        </div>
      </section>
    </main>
  );
}

function ContactItem({
  label,
  value,
  href,
}: {
  label: string;
  value: string;
  href?: string;
}) {
  const Container = href ? "a" : "div";
  const valueClassName = href
    ? "mt-2 text-sm md:text-base font-medium wrap-break-word"
    : "mt-2 text-base md:text-lg font-medium wrap-break-word";
  return (
    <Container
      {...(href
        ? {
            href,
            className:
              "group block rounded-2xl border bg-white/70 p-5 shadow-sm backdrop-blur transition-colors duration-250 ease-out " +
              "border-black/20 text-black hover:bg-black hover:text-white hover:border-black/70 " +
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/40 " +
              "dark:border-white/20 dark:bg-black/40 dark:text-white dark:hover:bg-white dark:hover:text-black dark:hover:border-white/70 dark:focus-visible:ring-white/40",
          }
        : {
            className:
              "block rounded-2xl border bg-white/70 p-5 shadow-sm backdrop-blur " +
              "border-black/20 text-black dark:border-white/20 dark:bg-black/40 dark:text-white",
          })}
    >
      <div className="text-xs font-semibold uppercase tracking-wide opacity-70">
        {label}
      </div>
      <div className={valueClassName}>{value}</div>
      {href ? (
        <div className="mt-3 text-xs opacity-70 group-hover:opacity-90">
          Click to email
        </div>
      ) : null}
    </Container>
  );
}
