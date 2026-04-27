"use client";

import { useEffect, useRef } from "react";
import { MOTION } from "../_lib/motion";
import { Section } from "./_ui/Section";
import { Eyebrow } from "./_ui/Eyebrow";

interface Props {
  totalPriceCents: number;
  milestoneCents: number | null;
  retainerPriceCents: number | null;
  retainerBullets: string[];
  currency: string;
}

function fmt(cents: number, currency: string) {
  return new Intl.NumberFormat("en-AE", { style: "currency", currency, minimumFractionDigits: 0 }).format(cents / 100);
}

export function InvestmentSection({
  totalPriceCents, milestoneCents, retainerPriceCents, retainerBullets, currency,
}: Props) {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    import("gsap").then(({ gsap }) => {
      import("gsap/ScrollTrigger").then(({ ScrollTrigger }) => {
        gsap.registerPlugin(ScrollTrigger);
        const els = sectionRef.current?.querySelectorAll(".inv-reveal");
        if (!els) return;
        els.forEach((el, i) => {
          gsap.fromTo(el, { y: MOTION.yFrom * 2, opacity: 0 }, {
            y: 0, opacity: 1, duration: MOTION.slow,
            delay: i * 0.15,
            ease: MOTION.easeOut,
            scrollTrigger: { trigger: sectionRef.current, start: MOTION.scrollStart },
          });
        });
      });
    });
  }, []);

  return (
    <Section ref={sectionRef} className="py-20 md:py-28">
      <Eyebrow>Investment</Eyebrow>

      <div className="mt-6 md:mt-8">
        <p
          className="text-xs uppercase tracking-widest opacity-35 mb-3"
          style={{ letterSpacing: "0.2em" }}
        >
          Total Project Investment
        </p>
        <p
          className="inv-reveal opacity-0 tabular-nums leading-none"
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "var(--fs-h1)",
            fontWeight: 300,
            fontStyle: "italic",
            color: "var(--accent)",
            letterSpacing: "var(--tracking-tight)",
          }}
        >
          {fmt(totalPriceCents, currency)}
        </p>

        {milestoneCents && (
          <p className="mt-5 text-sm opacity-45">
            First milestone (50%):{" "}
            <span className="font-semibold opacity-80">{fmt(milestoneCents, currency)}</span>
          </p>
        )}
      </div>

      {retainerPriceCents && (
        <div className="inv-reveal opacity-0 mt-20 md:mt-28 border-t border-[color:var(--border)] pt-12 md:pt-16">
          <p
            className="text-xs uppercase tracking-widest opacity-35 mb-3"
            style={{ letterSpacing: "0.2em" }}
          >
            Monthly Retainer
          </p>
          <p
            className="tabular-nums leading-none"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(2rem, 5vw, 4.5rem)",
              fontWeight: 300,
              fontStyle: "italic",
              color: "oklch(from var(--accent) l c h / 0.55)",
              letterSpacing: "var(--tracking-tight)",
            }}
          >
            {fmt(retainerPriceCents, currency)}
            <span style={{ fontSize: "0.3em", opacity: 0.65, fontStyle: "normal" }}>/mo</span>
          </p>

          {retainerBullets.length > 0 && (
            <ul className="mt-10 space-y-3 max-w-md">
              {retainerBullets.map((b, i) => (
                <li key={i} className="flex items-start gap-3 text-sm opacity-55">
                  <span
                    className="mt-2 w-1 h-1 rounded-full shrink-0"
                    style={{ background: "var(--accent)" }}
                  />
                  {b}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </Section>
  );
}
