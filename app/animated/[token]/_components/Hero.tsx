"use client";

import { useEffect, useRef } from "react";
import type { AnimatedProposal } from "@/types/animated-proposal";
import Image from "next/image";
import { MOTION } from "../_lib/motion";
import { Heading } from "./_ui/Heading";

interface Props {
  proposal: AnimatedProposal;
  introComplete: boolean;
}

export function Hero({ proposal, introComplete }: Props) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const metaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!introComplete) return;

    import("gsap").then(({ gsap }) => {
      const tl = gsap.timeline({ defaults: { ease: MOTION.easeOut } });
      tl.fromTo(headingRef.current, { y: 60, opacity: 0 }, { y: 0, opacity: 1, duration: MOTION.slow })
        .fromTo(subtitleRef.current, { y: MOTION.yFrom, opacity: 0 }, { y: 0, opacity: 1, duration: MOTION.base }, "-=0.5")
        .fromTo(metaRef.current, { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: MOTION.fast }, "-=0.4");
    });
  }, [introComplete]);

  const isXmaMedia = proposal.brand === "xma_media";

  return (
    <section className="relative min-h-screen flex flex-col px-6 md:px-16 lg:px-24 py-16 md:py-24 overflow-hidden">
      <div
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse 80% 60% at 50% 0%, oklch(from var(--accent) l c h / 0.4) 0%, transparent 70%)",
          zIndex: "var(--z-bg)",
        }}
      />

      <div className="flex items-center justify-between mb-12 md:mb-16">
        {isXmaMedia ? (
          <Image src="/XMA-01.png" alt="XMA Media" width={120} height={40} className="h-8 w-auto object-contain" />
        ) : (
          <Image src="/XMA-White.svg" alt="XMA" width={100} height={40} className="h-7 w-auto" />
        )}
        <p className="text-[var(--fs-eyebrow)] tracking-[var(--tracking-eyebrow)] uppercase opacity-40 font-medium">
          {new Date(proposal.proposal_date).toLocaleDateString("en-AE", { year: "numeric", month: "long" })}
        </p>
      </div>

      <div className="flex-1 flex flex-col justify-center max-w-5xl">
        <p className="text-[var(--fs-eyebrow)] tracking-[var(--tracking-eyebrow)] uppercase opacity-50 mb-6 font-medium">
          {proposal.company_name}
        </p>

        <Heading
          ref={headingRef}
          as="h1"
          size="h1"
          font="display"
          italic
          weight={400}
          className="mb-8 md:mb-10 opacity-0"
          style={{ textWrap: "balance" } as React.CSSProperties}
        >
          {proposal.project_title}
        </Heading>

        <p
          ref={subtitleRef}
          className="text-lg md:text-xl leading-relaxed max-w-2xl opacity-0"
          style={{ color: "oklch(from var(--fg) l c h / 0.65)" }}
        >
          {proposal.intro_paragraph}
        </p>
      </div>

      <div
        ref={metaRef}
        className="flex flex-wrap justify-between gap-x-6 gap-y-4 mt-16 md:mt-20 pt-8 border-t border-[color:var(--border)] opacity-0"
      >
        <MetaChip label="Prepared by" value={proposal.provider_name} />
        <MetaChip label="Agency" value={proposal.agency_name} />
        <MetaChip label="Date" value={new Date(proposal.proposal_date).toLocaleDateString("en-AE", { year: "numeric", month: "long", day: "numeric" })} />
      </div>
    </section>
  );
}

function MetaChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[var(--fs-eyebrow)] tracking-[var(--tracking-eyebrow)] uppercase opacity-40">{label}</span>
      <span className="text-sm font-semibold">{value}</span>
    </div>
  );
}
