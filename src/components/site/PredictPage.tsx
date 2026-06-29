"use client";

import * as React from "react";
import Link from "next/link";
import NextImage from "next/image";
import { motion } from "motion/react";
import {
  ArrowLeft,
  ArrowUpRight,
  Globe,
  Sparkles,
  TrendingUp,
  Target,
  Building2,
  HeartPulse,
  Users,
  Landmark,
} from "lucide-react";

/** Project accent — the deep teal pulled from the PREDICT wordmark. */
const ACCENT = "#159aa8";

const PROJECT_URL =
  "https://nearlab.polimi.it/neuroengineering-and-medical-robotics/medical/predict/";

const LOGO = "/predict/Frame 19.png";
const ICON = "/predict/Frame 24.png";
const IMG_DIFFUSION = "/predict/Frame 33.png";
const IMG_SYNTH = "/predict/ct_syntheticct_39.png";
const IMG_SEG = "/predict/Frame 32.png";

const fadeUp = {
  initial: { opacity: 0, y: 18 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-12%" },
  transition: { duration: 0.55 },
};

const STATS: { value: string; label: string }[] = [
  { value: "~500", label: "ovarian-cancer deaths each year in Lombardy" },
  { value: "3", label: "research & clinical partners in the consortium" },
  { value: "T₀", label: "predictions delivered at diagnosis, before therapy" },
];

const PILLARS: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  body: string;
}[] = [
  {
    icon: Sparkles,
    title: "Generate",
    body: "Generative models synthesise the post-chemotherapy CT scan directly from the baseline scan acquired at diagnosis — visualising the likely effect of treatment before it begins.",
  },
  {
    icon: TrendingUp,
    title: "Forecast",
    body: "From a single baseline CT and clinical data, the models anticipate how the disease is likely to progress, giving clinicians a forward view of the patient's trajectory.",
  },
  {
    icon: Target,
    title: "Predict",
    body: "Treatment response is estimated up front, supporting earlier, more personalised decisions between surgical and chemotherapy-first strategies.",
  },
];

const GALLERY: {
  src: string;
  title: string;
  caption: string;
  fit: "cover" | "contain";
}[] = [
  {
    src: IMG_DIFFUSION,
    title: "Generative CT synthesis",
    caption:
      "A diffusion process denoises pure noise into anatomically coherent CT slices across axial, coronal and sagittal views — the engine behind synthesising follow-up imaging at diagnosis.",
    fit: "cover",
  },
  {
    src: IMG_SYNTH,
    title: "Real vs. synthetic CT",
    caption:
      "Side-by-side comparison of acquired and AI-generated CT with per-voxel difference maps, used to quantify how faithfully the model reproduces patient anatomy.",
    fit: "cover",
  },
  {
    src: IMG_SEG,
    title: "Tumor & multi-organ segmentation",
    caption:
      "Automated delineation of tumor burden (green) and surrounding abdominal organs across the CT volume — the structured substrate for progression and response modelling.",
    fit: "contain",
  },
];

const PARTNERS: { name: string; place: string }[] = [
  { name: "Politecnico di Milano", place: "NEARLab · Milan, IT" },
  { name: "Istituto Europeo di Oncologia (IEO)", place: "Milan, IT" },
  { name: "Università degli Studi dell'Insubria", place: "Varese, IT" },
];

const TEAM = ["Elena De Momi", "Mattia Magro", "Chiara Lena", "Francesca Fati"];

const FUNDING: { label: string; value: string }[] = [
  { label: "Funder", value: "Fondazione Regionale per la Ricerca Biomedica (FRRB)" },
  { label: "Programme", value: "Regione Lombardia" },
  { label: "Project ID", value: "012024R0055 — PREDICT" },
];

export function PredictPage() {
  return (
    <div className="font-montserrat relative min-h-screen overflow-x-hidden">
      <TopBar />

      <Hero />

      <main className="mx-auto max-w-6xl px-4 sm:px-6">
        <StatStrip />
        <Overview />
        <Pillars />
        <Gallery />
        <Consortium />
        <Funding />
        <ClosingCta />
      </main>

      <Footer />
    </div>
  );
}

/* ------------------------------------------------------------------ */

function TopBar() {
  return (
    <header className="fixed top-0 inset-x-0 z-50 pointer-events-none">
      <div className="mx-auto max-w-6xl px-3 sm:px-4 pt-3 sm:pt-5">
        <div className="pointer-events-auto flex items-center justify-between gap-3 rounded-full border border-black/12 bg-[var(--surface-tint)]/75 backdrop-blur-xl px-2 py-2 shadow-[0_8px_30px_rgba(21,154,168,0.16)]">
          <Link
            href="/"
            className="inline-flex items-center gap-2 shrink-0 pl-3 pr-2 py-1 text-sm text-black/75 hover:text-black transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="font-display tracking-[0.04em]">Francesca Fati</span>
          </Link>

          <div className="flex items-center gap-2">
            <NextImage
              src={ICON}
              alt="PREDICT"
              width={22}
              height={22}
              className="h-5 w-5 object-contain"
            />
            <span className="hidden sm:inline font-display tracking-[0.18em] text-sm text-black/80">
              PREDICT
            </span>
          </div>

          <a
            href={PROJECT_URL}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 px-3 py-2 rounded-full text-xs font-medium bg-black text-white hover:bg-black/90 transition-colors"
          >
            <Globe className="h-4 w-4" />
            <span className="hidden sm:inline">Project site</span>
            <ArrowUpRight className="h-3.5 w-3.5 opacity-70" />
          </a>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section
      className="relative isolate overflow-hidden"
      aria-label="PREDICT — project overview"
    >
      {/* tinted backdrop */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(1100px 520px at 50% -8%, rgba(21,154,168,0.16), transparent 62%), radial-gradient(760px 380px at 82% 6%, rgba(234,173,118,0.10), transparent 66%)",
        }}
      />
      <div aria-hidden className="bg-grid pointer-events-none absolute inset-0 -z-10 opacity-60" />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(21,154,168,0.6), rgba(234,173,118,0.4), transparent)",
        }}
      />

      <div className="mx-auto max-w-6xl px-4 sm:px-6 pt-32 sm:pt-40 pb-12 sm:pb-16 flex flex-col items-center text-center">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 rounded-full border border-black/12 bg-[var(--surface-tint)]/70 backdrop-blur px-3.5 py-1.5 text-[11px] tracking-[0.06em] text-black/65"
        >
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: ACCENT }} />
          FUNDED RESEARCH · FRRB · REGIONE LOMBARDIA
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.08 }}
          className="relative mt-7 w-full max-w-3xl"
        >
          <NextImage
            src={LOGO}
            alt="PREDICT"
            width={2000}
            height={346}
            priority
            className="h-auto w-full"
          />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.16 }}
          className="mt-8 max-w-3xl font-display text-xl sm:text-2xl md:text-3xl leading-[1.15] text-black"
        >
          Predictive Response and Disease Evaluation in Ovarian Cancer with
          Generative AI
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.24 }}
          className="mt-5 max-w-2xl text-sm sm:text-base text-black/65 leading-relaxed"
          style={{ fontFamily: "var(--font-body)" }}
        >
          A generative-AI consortium that anticipates tumor progression and
          treatment response in ovarian cancer from the CT scan acquired at
          diagnosis — bringing post-treatment insight forward to the moment care
          decisions are made.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.32 }}
          className="mt-8 flex flex-wrap items-center justify-center gap-2.5"
        >
          <a
            href={PROJECT_URL}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-black text-white px-5 py-2.5 text-sm font-medium hover:bg-black/90 transition-colors"
          >
            <Globe className="h-4 w-4" />
            Visit the project site
            <ArrowUpRight className="h-4 w-4 opacity-70" />
          </a>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full border border-black/12 bg-[var(--surface-tint)]/70 backdrop-blur-xl px-5 py-2.5 text-sm font-medium text-black/85 hover:text-black hover:border-black/25 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to portfolio
          </Link>
        </motion.div>
      </div>

      <div className="h-px w-full bg-gradient-to-r from-transparent via-black/15 to-transparent" />
    </section>
  );
}

function StatStrip() {
  return (
    <section className="py-12 sm:py-14">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
        {STATS.map((s, i) => (
          <motion.div
            key={s.label}
            {...fadeUp}
            transition={{ ...fadeUp.transition, delay: i * 0.08 }}
            className="rounded-3xl border border-black/10 bg-black/[0.03] px-6 py-7 text-center"
          >
            <div
              className="font-display text-4xl sm:text-5xl leading-none"
              style={{ color: ACCENT }}
            >
              {s.value}
            </div>
            <p
              className="mt-3 text-sm text-black/65 leading-snug"
              style={{ fontFamily: "var(--font-body)" }}
            >
              {s.label}
            </p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

function SectionHeading({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <header className="mb-8 sm:mb-10">
      <motion.span
        {...fadeUp}
        className="text-[11px] tracking-[0.14em] uppercase"
        style={{ fontFamily: "var(--font-body)", color: ACCENT }}
      >
        {eyebrow}
      </motion.span>
      <motion.h2
        {...fadeUp}
        transition={{ ...fadeUp.transition, delay: 0.05 }}
        className="mt-2 font-display tracking-[0.01em] text-3xl sm:text-4xl md:text-5xl leading-[0.98] text-black"
      >
        {title}
      </motion.h2>
      <motion.span
        aria-hidden
        initial={{ scaleX: 0, opacity: 0 }}
        whileInView={{ scaleX: 1, opacity: 1 }}
        viewport={{ once: true, margin: "-12%" }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="block mt-3 h-[3px] w-20 origin-left rounded-full"
        style={{ background: `linear-gradient(90deg, ${ACCENT} 0%, var(--secondary) 100%)` }}
      />
      {subtitle ? (
        <motion.p
          {...fadeUp}
          transition={{ ...fadeUp.transition, delay: 0.12 }}
          className="mt-4 max-w-2xl text-sm sm:text-base text-black/65 leading-relaxed"
          style={{ fontFamily: "var(--font-body)" }}
        >
          {subtitle}
        </motion.p>
      ) : null}
    </header>
  );
}

function Overview() {
  return (
    <section className="py-12 sm:py-16 border-t border-black/8">
      <SectionHeading eyebrow="The challenge" title="Why PREDICT" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
        <motion.div
          {...fadeUp}
          className="space-y-4 text-black/80 text-[15px] sm:text-base leading-relaxed"
          style={{ fontFamily: "var(--font-body)" }}
        >
          <p>
            Ovarian cancer is often diagnosed late, and the delay between
            detection and the right therapeutic decision costs lives — roughly{" "}
            <b>500 deaths each year in Lombardy alone</b>, a substantial share of
            them tied to diagnostic and decision-making delays.
          </p>
          <p>
            PREDICT leverages generative artificial intelligence to support the
            clinicians who care for these patients. From the CT scan acquired at
            diagnosis, the project generates the likely post-chemotherapy CT,
            anticipates how the tumor will progress, and predicts treatment
            response — all <i>before</i> therapy begins.
          </p>
          <p>
            By moving this insight forward to diagnosis time, PREDICT aims to
            enable more precise, individualised care strategies that reduce both
            unnecessary surgery and mortality.
          </p>
        </motion.div>

        <motion.aside
          {...fadeUp}
          transition={{ ...fadeUp.transition, delay: 0.1 }}
          className="rounded-3xl border border-black/10 bg-black/[0.03] p-6 sm:p-8"
        >
          <HeartPulse className="h-6 w-6" style={{ color: ACCENT }} />
          <h3 className="mt-4 font-display text-xl text-black">The goal</h3>
          <p
            className="mt-3 text-black/70 leading-relaxed text-[15px]"
            style={{ fontFamily: "var(--font-body)" }}
          >
            Deliver precise, personalised care strategies that cut diagnostic
            delay and lower ovarian-cancer mortality — turning a baseline scan
            into a forward-looking decision-support tool.
          </p>
          <div className="mt-6 h-px w-full bg-gradient-to-r from-[color:var(--accent,#159aa8)]/40 to-transparent" />
          <p
            className="mt-4 text-[13px] text-black/55 leading-relaxed"
            style={{ fontFamily: "var(--font-body)" }}
          >
            Led from NEARLab at Politecnico di Milano, in partnership with IEO
            and Università degli Studi dell&apos;Insubria.
          </p>
        </motion.aside>
      </div>
    </section>
  );
}

function Pillars() {
  return (
    <section className="py-12 sm:py-16 border-t border-black/8">
      <SectionHeading
        eyebrow="The approach"
        title="Three capabilities"
        subtitle="A single baseline CT feeds three generative and predictive tasks, each surfacing information that is normally only available after treatment."
      />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
        {PILLARS.map((p, i) => {
          const Icon = p.icon;
          return (
            <motion.div
              key={p.title}
              {...fadeUp}
              transition={{ ...fadeUp.transition, delay: i * 0.08 }}
              className="group relative rounded-3xl border border-black/10 bg-[var(--surface-tint)] p-6 sm:p-7 overflow-hidden"
            >
              <div
                aria-hidden
                className="absolute -right-8 -top-8 h-24 w-24 rounded-full opacity-[0.12] blur-2xl transition-opacity group-hover:opacity-25"
                style={{ background: ACCENT }}
              />
              <span
                className="inline-flex h-11 w-11 items-center justify-center rounded-2xl"
                style={{ background: "rgba(21,154,168,0.12)", color: ACCENT }}
              >
                <Icon className="h-5 w-5" />
              </span>
              <h3 className="mt-5 font-display text-2xl text-black">{p.title}</h3>
              <p
                className="mt-3 text-[15px] text-black/70 leading-relaxed"
                style={{ fontFamily: "var(--font-body)" }}
              >
                {p.body}
              </p>
              <span
                className="mt-6 block h-px w-full origin-left scale-x-100"
                style={{
                  background: `linear-gradient(90deg, ${ACCENT}, transparent)`,
                }}
              />
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}

function Gallery() {
  return (
    <section className="py-12 sm:py-16 border-t border-black/8">
      <SectionHeading
        eyebrow="Inside the models"
        title="From noise to anatomy"
        subtitle="Generative synthesis, fidelity checks against acquired scans, and automated segmentation form the imaging pipeline behind PREDICT."
      />
      <div className="space-y-5">
        {/* Featured large tile */}
        <motion.figure
          {...fadeUp}
          className="overflow-hidden rounded-3xl border border-black/10 bg-black"
        >
          <div className="relative aspect-[16/8] w-full">
            <NextImage
              src={GALLERY[0].src}
              alt={GALLERY[0].title}
              fill
              sizes="(min-width: 768px) 1100px, 100vw"
              className="object-cover"
            />
          </div>
          <figcaption className="px-5 py-4 bg-[var(--surface-tint)] border-t border-black/8">
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: ACCENT }} />
              <span className="font-display text-sm text-black">{GALLERY[0].title}</span>
            </div>
            <p
              className="mt-1.5 text-[13px] text-black/60 leading-relaxed"
              style={{ fontFamily: "var(--font-body)" }}
            >
              {GALLERY[0].caption}
            </p>
          </figcaption>
        </motion.figure>

        {/* Two-up */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {GALLERY.slice(1).map((g, i) => (
            <motion.figure
              key={g.src}
              {...fadeUp}
              transition={{ ...fadeUp.transition, delay: i * 0.08 }}
              className="overflow-hidden rounded-3xl border border-black/10 bg-black"
            >
              <div className="relative aspect-[16/10] w-full">
                <NextImage
                  src={g.src}
                  alt={g.title}
                  fill
                  sizes="(min-width: 768px) 540px, 100vw"
                  className={g.fit === "contain" ? "object-contain" : "object-cover"}
                />
              </div>
              <figcaption className="px-5 py-4 bg-[var(--surface-tint)] border-t border-black/8">
                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: ACCENT }} />
                  <span className="font-display text-sm text-black">{g.title}</span>
                </div>
                <p
                  className="mt-1.5 text-[13px] text-black/60 leading-relaxed"
                  style={{ fontFamily: "var(--font-body)" }}
                >
                  {g.caption}
                </p>
              </figcaption>
            </motion.figure>
          ))}
        </div>
      </div>
    </section>
  );
}

function Consortium() {
  return (
    <section className="py-12 sm:py-16 border-t border-black/8">
      <SectionHeading
        eyebrow="The consortium"
        title="Partners & people"
        subtitle="A three-partner collaboration bridging engineering and oncology."
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
        {PARTNERS.map((p, i) => (
          <motion.div
            key={p.name}
            {...fadeUp}
            transition={{ ...fadeUp.transition, delay: i * 0.08 }}
            className="rounded-3xl border border-black/10 bg-black/[0.03] p-6"
          >
            <Building2 className="h-5 w-5" style={{ color: ACCENT }} />
            <h3 className="mt-4 font-display text-lg leading-snug text-black">
              {p.name}
            </h3>
            <p
              className="mt-1.5 text-[13px] text-black/55"
              style={{ fontFamily: "var(--font-body)" }}
            >
              {p.place}
            </p>
          </motion.div>
        ))}
      </div>

      <motion.div
        {...fadeUp}
        className="mt-5 rounded-3xl border border-black/10 bg-[var(--surface-tint)] p-6 sm:p-7"
      >
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5" style={{ color: ACCENT }} />
          <span className="font-display text-sm tracking-[0.04em] text-black/80">
            Principal investigators
          </span>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {TEAM.map((name) => (
            <span
              key={name}
              className="rounded-full border border-black/15 bg-black/[0.04] px-3.5 py-1.5 text-sm text-black/80"
              style={{ fontFamily: "var(--font-body)" }}
            >
              {name}
            </span>
          ))}
        </div>
      </motion.div>
    </section>
  );
}

function Funding() {
  return (
    <section className="py-12 sm:py-16 border-t border-black/8">
      <SectionHeading eyebrow="Support" title="Funding" />
      <motion.div
        {...fadeUp}
        className="rounded-3xl border border-black/10 bg-black/[0.03] p-6 sm:p-8"
      >
        <Landmark className="h-6 w-6" style={{ color: ACCENT }} />
        <dl className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-5">
          {FUNDING.map((f) => (
            <div key={f.label}>
              <dt
                className="text-[11px] tracking-[0.06em] uppercase text-black/45"
                style={{ fontFamily: "var(--font-body)" }}
              >
                {f.label}
              </dt>
              <dd
                className="mt-1.5 text-black/85 text-[15px] leading-snug"
                style={{ fontFamily: "var(--font-body)" }}
              >
                {f.value}
              </dd>
            </div>
          ))}
        </dl>
      </motion.div>
    </section>
  );
}

function ClosingCta() {
  return (
    <section className="py-14 sm:py-20 border-t border-black/8">
      <motion.div
        {...fadeUp}
        className="relative overflow-hidden rounded-[2rem] border border-black/10 bg-black px-6 py-12 sm:px-12 sm:py-16 text-center"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{
            background: `radial-gradient(600px 240px at 50% 0%, ${ACCENT}, transparent 70%)`,
          }}
        />
        <div className="relative">
          <NextImage
            src={ICON}
            alt=""
            width={48}
            height={48}
            className="mx-auto h-12 w-12 object-contain brightness-0 invert"
          />
          <h2 className="mt-6 font-display text-2xl sm:text-3xl text-white">
            Anticipating ovarian cancer, one scan ahead.
          </h2>
          <p
            className="mx-auto mt-4 max-w-xl text-white/65 leading-relaxed text-sm sm:text-base"
            style={{ fontFamily: "var(--font-body)" }}
          >
            Learn more about the methods, the team and ongoing results on the
            official project page.
          </p>
          <a
            href={PROJECT_URL}
            target="_blank"
            rel="noreferrer"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-white text-black px-6 py-3 text-sm font-medium hover:bg-white/90 transition-colors"
          >
            <Globe className="h-4 w-4" />
            Visit the PREDICT project site
            <ArrowUpRight className="h-4 w-4 opacity-70" />
          </a>
        </div>
      </motion.div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="mx-auto max-w-6xl px-4 sm:px-6 pb-10">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-black/8 pt-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-black/60 hover:text-black transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Francesca Fati — portfolio
        </Link>
        <p
          className="text-[12px] text-black/45 text-center"
          style={{ fontFamily: "var(--font-body)" }}
        >
          PREDICT · FRRB 012024R0055 · Regione Lombardia
        </p>
      </div>
    </footer>
  );
}
