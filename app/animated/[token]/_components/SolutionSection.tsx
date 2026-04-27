"use client";

import { useEffect, useRef } from "react";
import type { ProposalCard } from "@/types/animated-proposal";
import { getIcon } from "@/lib/icon-map";
import { MOTION } from "../_lib/motion";
import { Section } from "./_ui/Section";
import { Eyebrow } from "./_ui/Eyebrow";

interface Props {
  intro: string;
  solutions: ProposalCard[];
}

export function SolutionSection({ intro, solutions }: Props) {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    import("gsap").then(({ gsap }) => {
      import("gsap/ScrollTrigger").then(({ ScrollTrigger }) => {
        gsap.registerPlugin(ScrollTrigger);
        const cards = sectionRef.current?.querySelectorAll(".solution-card");
        if (!cards) return;
        cards.forEach((card) => {
          gsap.fromTo(card, { opacity: 0, y: MOTION.yFrom }, {
            opacity: 1, y: 0, duration: MOTION.base, ease: MOTION.easeOut,
            scrollTrigger: { trigger: card, start: MOTION.scrollStart },
          });
        });
      });
    });
  }, []);

  return (
    <Section ref={sectionRef} className="py-20 md:py-28">
      <Eyebrow>The Solution</Eyebrow>
      <p className="text-base leading-relaxed opacity-55 mb-10 max-w-xl">{intro}</p>

      <div>
        {solutions.map((solution, i) => {
          const Icon = getIcon(solution.icon_key);
          return (
            <div
              key={i}
              className="solution-card opacity-0 py-8 md:py-10 border-t border-[color:var(--border)]"
            >
              <div className="flex items-start gap-4 mb-3">
                <Icon
                  size={20}
                  strokeWidth={1.5}
                  className="shrink-0 mt-1"
                  style={{ color: "var(--accent-2)" }}
                />
                <h3
                  className="font-semibold leading-tight"
                  style={{ fontSize: "var(--fs-h2)", letterSpacing: "var(--tracking-tight)" }}
                >
                  {solution.title}
                </h3>
              </div>
              <p className="text-base leading-relaxed opacity-55 pl-9">{solution.desc}</p>
            </div>
          );
        })}
        <div className="border-t border-[color:var(--border)]" />
      </div>
    </Section>
  );
}
