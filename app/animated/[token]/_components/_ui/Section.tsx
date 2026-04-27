import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface SectionProps extends HTMLAttributes<HTMLElement> {
  narrow?: boolean;
  tone?: "default" | "muted" | "accent-wash";
  bleed?: boolean;
  align?: "center" | "offset-left" | "offset-right";
}

const Section = forwardRef<HTMLElement, SectionProps>(function Section(
  { children, className, narrow, tone = "default", bleed, align = "center", style, ...props },
  ref
) {
  const toneStyle =
    tone === "accent-wash"
      ? { background: "oklch(from var(--accent) l c h / 0.04)", ...style }
      : style;

  const innerClass = bleed
    ? "w-full"
    : cn(
        "mx-auto",
        narrow ? "max-w-[52rem]" : "max-w-6xl",
        align === "offset-left" && "lg:ml-[8.33%] lg:mr-auto lg:max-w-5xl",
        align === "offset-right" && "lg:mr-[8.33%] lg:ml-auto lg:max-w-5xl"
      );

  return (
    <section
      ref={ref}
      style={toneStyle}
      className={cn(
        bleed ? "" : "px-6 md:px-16 lg:px-24",
        "py-16 md:py-24",
        tone === "muted" && "bg-(--muted)",
        className
      )}
      {...props}
    >
      <div className={innerClass}>
        {children}
      </div>
    </section>
  );
});

export { Section };
