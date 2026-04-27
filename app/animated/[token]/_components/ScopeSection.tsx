"use client";

import { useEffect, useRef } from "react";
import type { ScopeItem } from "@/types/animated-proposal";
import { MOTION } from "../_lib/motion";
import { Section } from "./_ui/Section";
import { Eyebrow } from "./_ui/Eyebrow";

interface Props {
  phaseName: string | null;
  subtitle: string | null;
  items: ScopeItem[];
}

export function ScopeSection({ phaseName, subtitle, items }: Props) {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    import("gsap").then(({ gsap }) => {
      import("gsap/ScrollTrigger").then(({ ScrollTrigger }) => {
        gsap.registerPlugin(ScrollTrigger);
        const rows = sectionRef.current?.querySelectorAll(".scope-row");
        if (!rows) return;
        rows.forEach((row) => {
          gsap.fromTo(row, { opacity: 0, y: MOTION.yFrom }, {
            opacity: 1, y: 0, duration: MOTION.base, ease: MOTION.easeOut,
            scrollTrigger: { trigger: row, start: "top 90%" },
          });
        });
      });
    });
  }, []);

  return (
    <Section ref={sectionRef} className="py-20 md:py-28">
      <div className="mb-10">
        <Eyebrow>Scope of Work</Eyebrow>
        <h2
          className="font-semibold"
          style={{ fontSize: "var(--fs-h2)", letterSpacing: "var(--tracking-tight)" }}
        >
          {phaseName ?? "What We Build"}
        </h2>
        {subtitle && <p className="mt-2 opacity-55 text-base">{subtitle}</p>}
      </div>

      <dl>
        {items.map((item, i) => (
          <div
            key={i}
            className="scope-row opacity-0 flex items-start gap-6 md:gap-12 py-7 md:py-9 border-t border-[color:var(--border)]"
          >
            <dt className="shrink-0" style={{ minWidth: "2.5rem" }}>
              <span
                className="tabular-nums select-none leading-none"
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "var(--fs-h3)",
                  fontStyle: "italic",
                  fontWeight: 300,
                  opacity: 0.25,
                  color: "var(--accent)",
                }}
              >
                {String(i + 1).padStart(2, "0")}
              </span>
            </dt>
            <dd className="flex-1">
              <h4
                className="font-semibold mb-2 leading-tight"
                style={{ fontSize: "var(--fs-h2)", letterSpacing: "var(--tracking-tight)" }}
              >
                {item.title}
              </h4>
              <p className="text-sm leading-relaxed opacity-55">{item.desc}</p>
            </dd>
          </div>
        ))}
        <div className="border-t border-[color:var(--border)]" />
      </dl>
    </Section>
  );
}
