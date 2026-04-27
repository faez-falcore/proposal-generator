"use client";

import { useEffect, useRef, useState } from "react";
import { MOTION } from "../_lib/motion";
import { Section } from "./_ui/Section";

interface Props {
  guaranteeText: string;
  phaseTwoTeaser: string | null;
}

const TYPEWRITER_MS = 20;

export function GuaranteeSection({ guaranteeText, phaseTwoTeaser }: Props) {
  const sectionRef = useRef<HTMLElement>(null);
  const [displayedText, setDisplayedText] = useState("");
  const [started, setStarted] = useState(false);

  useEffect(() => {
    import("gsap").then(({ gsap }) => {
      import("gsap/ScrollTrigger").then(({ ScrollTrigger }) => {
        gsap.registerPlugin(ScrollTrigger);
        ScrollTrigger.create({
          trigger: sectionRef.current,
          start: MOTION.scrollStart,
          onEnter: () => setStarted(true),
          once: true,
        });
      });
    });
  }, []);

  useEffect(() => {
    if (!started) return;
    let i = 0;
    const interval = setInterval(() => {
      setDisplayedText(guaranteeText.slice(0, i));
      i++;
      if (i > guaranteeText.length) clearInterval(interval);
    }, TYPEWRITER_MS);
    return () => clearInterval(interval);
  }, [started, guaranteeText]);

  return (
    <Section
      ref={sectionRef}
      bleed
      className="py-24 md:py-36"
      style={{
        background: "var(--accent)",
      }}
    >
      <div className="px-6 md:px-16 lg:px-24 max-w-5xl mx-auto">
        <p
          className="text-xs uppercase font-medium mb-8"
          style={{ letterSpacing: "0.25em", color: "oklch(from var(--accent) 0.95 0.02 h)" }}
        >
          Our Guarantee
        </p>

        <blockquote
          className="leading-snug"
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "var(--fs-h2)",
            fontStyle: "italic",
            fontWeight: 300,
            letterSpacing: "var(--tracking-tight)",
            color: "oklch(1 0 0)",
          }}
        >
          {displayedText}
          {started && displayedText.length < guaranteeText.length && (
            <span
              className="animate-pulse"
              style={{ color: "oklch(1 0 0 / 0.5)" }}
            >
              |
            </span>
          )}
        </blockquote>

        {phaseTwoTeaser && (
          <p
            className="mt-10 md:mt-14 text-base max-w-2xl"
            style={{ color: "oklch(1 0 0 / 0.65)" }}
          >
            {phaseTwoTeaser}
          </p>
        )}
      </div>
    </Section>
  );
}
