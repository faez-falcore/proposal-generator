"use client";

import { useEffect, useRef } from "react";
import type { ProposalCard } from "@/types/animated-proposal";
import { MOTION } from "../_lib/motion";
import { Section } from "./_ui/Section";
import { Eyebrow } from "./_ui/Eyebrow";

interface Props {
  problems: ProposalCard[];
}

export function ChallengeSection({ problems }: Props) {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    import("gsap").then(({ gsap }) => {
      import("gsap/ScrollTrigger").then(({ ScrollTrigger }) => {
        gsap.registerPlugin(ScrollTrigger);
        const rows = sectionRef.current?.querySelectorAll(".challenge-row");
        if (!rows) return;
        rows.forEach((row) => {
          const numeral = row.querySelector(".challenge-numeral");
          const content = row.querySelector(".challenge-content");
          gsap.fromTo(numeral, { opacity: 0, x: -48 }, {
            opacity: 1, x: 0, duration: MOTION.slow, ease: MOTION.easeOut,
            scrollTrigger: { trigger: row, start: "top 88%" },
          });
          gsap.fromTo(content, { opacity: 0, y: MOTION.yFrom }, {
            opacity: 1, y: 0, duration: MOTION.base, ease: MOTION.easeOut,
            scrollTrigger: { trigger: row, start: "top 88%" },
          });
        });
      });
    });
  }, []);

  return (
    <Section
      ref={sectionRef}
      className="py-20 md:py-28"
      style={{
        background: "linear-gradient(to bottom, oklch(from var(--accent-danger) l c h / 0.06) 0%, transparent 45%)",
      }}
    >
      <Eyebrow accent>The Challenge</Eyebrow>

      <div className="mt-8 md:mt-12">
        {problems.map((problem, i) => (
          <div
            key={i}
            className="challenge-row flex items-start gap-4 md:gap-10 py-8 md:py-12 border-t border-[color:var(--border)]"
          >
            <span
              className="challenge-numeral shrink-0 select-none leading-none opacity-0"
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "var(--fs-numeral)",
                fontWeight: 200,
                fontStyle: "italic",
                color: "oklch(from var(--accent-danger) l c h / 0.2)",
                lineHeight: 0.85,
                marginTop: "-0.05em",
                minWidth: "3ch",
              }}
            >
              {String(i + 1).padStart(2, "0")}
            </span>
            <div className="challenge-content flex-1 pt-1 opacity-0">
              <h3
                className="font-semibold mb-3 leading-tight"
                style={{ fontSize: "var(--fs-h2)", letterSpacing: "var(--tracking-tight)" }}
              >
                {problem.title}
              </h3>
              <p className="text-base leading-relaxed opacity-55">{problem.desc}</p>
            </div>
          </div>
        ))}
        <div className="border-t border-[color:var(--border)]" />
      </div>
    </Section>
  );
}
