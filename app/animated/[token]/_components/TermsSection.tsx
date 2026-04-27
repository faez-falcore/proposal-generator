"use client";

import { useState } from "react";
import type { TermsClause } from "@/types/animated-proposal";
import { Section } from "./_ui/Section";
import { Eyebrow } from "./_ui/Eyebrow";

interface Props {
  terms: TermsClause[];
}

export function TermsSection({ terms }: Props) {
  const [open, setOpen] = useState<string | null>(null);

  return (
    <Section>
      <Eyebrow>Terms & Conditions</Eyebrow>
      <p className="text-lg md:text-xl opacity-70 mb-10 md:mb-14">
        Mutual agreements that protect us both.
      </p>

      <div>
        {terms.map((clause) => {
          const isOpen = open === clause.clause_no;
          return (
            <div key={clause.clause_no} className="border-t border-[color:var(--border)]">
              <button
                className="w-full flex items-center justify-between py-5 md:py-6 text-left group"
                onClick={() => setOpen(isOpen ? null : clause.clause_no)}
              >
                <span className="flex items-center gap-5">
                  <span
                    className="tabular-nums shrink-0 opacity-30"
                    style={{
                      fontFamily: "var(--font-display)",
                      fontStyle: "italic",
                      fontSize: "var(--fs-h3)",
                      fontWeight: 300,
                      minWidth: "2.5rem",
                    }}
                  >
                    {clause.clause_no}
                  </span>
                  <span className="font-semibold text-base">{clause.title}</span>
                </span>
                <span
                  className="shrink-0 w-6 h-6 flex items-center justify-center rounded-full border border-[color:var(--border)] ml-4 transition-transform duration-300"
                  style={{
                    color: "var(--accent)",
                    transform: isOpen ? "rotate(45deg)" : "none",
                  }}
                >
                  +
                </span>
              </button>

              {isOpen && (
                <div className="pb-6 pl-16 md:pl-20 pr-4 md:pr-8">
                  <p className="text-sm leading-relaxed opacity-60 whitespace-pre-line">{clause.body}</p>
                </div>
              )}
            </div>
          );
        })}
        <div className="border-t border-[color:var(--border)]" />
      </div>
    </Section>
  );
}
