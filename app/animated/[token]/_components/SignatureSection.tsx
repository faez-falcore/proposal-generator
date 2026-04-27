"use client";

import { useRef, useState } from "react";
import SignatureCanvas from "react-signature-canvas";
import axios from "axios";
import type { AnimatedProposalStatus } from "@/types/animated-proposal";
import { Section } from "./_ui/Section";
import { Eyebrow } from "./_ui/Eyebrow";
import { Button, animButtonVariants } from "./_ui/Button";
import { useAccentColor } from "../_lib/useAccentColor";

interface Props {
  proposalId: string;
  clientSignedAt: string | null;
  stripeLink: string | null;
  status: AnimatedProposalStatus;
}

export function SignatureSection({ proposalId, clientSignedAt, stripeLink, status }: Props) {
  const sigRef = useRef<SignatureCanvas>(null);
  const [signing, setSigning] = useState(false);
  const [signed, setSigned] = useState(!!clientSignedAt);
  const [error, setError] = useState<string | null>(null);
  const [accentColor, sectionRef] = useAccentColor();

  const canSign = ["approved", "sent"].includes(status) && !signed;
  const showStripe = (status === "counter_signed" || status === "paid") && stripeLink;

  async function handleSign() {
    if (!sigRef.current || sigRef.current.isEmpty()) {
      setError("Please draw your signature first.");
      return;
    }
    setSigning(true);
    setError(null);
    try {
      const pngData = sigRef.current.getTrimmedCanvas().toDataURL("image/png");
      await axios.post(`/api/animated-proposals/${proposalId}/sign/client`, {
        signature_png_base64: pngData,
      });
      setSigned(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : null;
      setError((err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? msg ?? "Failed to submit signature. Please try again.");
    } finally {
      setSigning(false);
    }
  }

  return (
    <Section ref={sectionRef} narrow className="py-20 md:py-28">
      {signed ? (
        <div className="text-center py-16">
          <div
            className="mb-6"
            style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: "3rem", color: "var(--accent)" }}
          >
            ✓
          </div>
          <h2 className="mb-4" style={{ fontFamily: "var(--font-body)", fontSize: "var(--fs-h2)", fontWeight: 700 }}>
            Proposal Signed
          </h2>
          <p className="opacity-55 mb-10 text-base">
            Your signature has been received. We&apos;ll counter-sign and send you a confirmation.
          </p>
          {showStripe && (
            <a
              href={stripeLink}
              target="_blank"
              rel="noopener noreferrer"
              className={animButtonVariants({ size: "lg" })}
              style={{ background: "var(--accent)" }}
              onClick={() =>
                axios.post(`/api/animated-proposals/${proposalId}/events`, { event_type: "stripe_click" }).catch(() => {})
              }
            >
              Confirm & Make Payment →
            </a>
          )}
        </div>
      ) : canSign ? (
        <div>
          <Eyebrow>Sign & Proceed</Eyebrow>
          <p
            className="mb-2 leading-tight"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "var(--fs-h2)",
              fontStyle: "italic",
              fontWeight: 300,
              letterSpacing: "var(--tracking-tight)",
            }}
          >
            This is where it begins.
          </p>
          <p className="opacity-50 mb-8 text-sm leading-relaxed">
            Draw your signature in the field below to agree to the terms and confirm your intent to proceed.
          </p>

          <div
            className="relative mb-2"
            style={{
              border: "1.5px solid oklch(from var(--accent) l c h / 0.3)",
              borderRadius: "var(--r-card)",
              background: "oklch(from var(--fg) l c h / 0.03)",
              minHeight: "260px",
            }}
          >
            <SignatureCanvas
              ref={sigRef}
              penColor={accentColor}
              canvasProps={{
                style: {
                  width: "100%",
                  height: "260px",
                  display: "block",
                  background: "transparent",
                  borderRadius: "var(--r-card)",
                },
              }}
            />
            <div
              className="absolute pointer-events-none"
              style={{ bottom: "40px", left: "20px", right: "20px", height: "1px", background: "var(--fg)", opacity: 0.12 }}
            />
            <span
              className="absolute pointer-events-none select-none"
              style={{
                bottom: "12px",
                left: "20px",
                fontSize: "0.65rem",
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                opacity: 0.3,
              }}
            >
              Signature
            </span>
          </div>

          {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

          <div className="flex gap-3 flex-wrap mt-5">
            <Button onClick={handleSign} disabled={signing} size="md">
              {signing ? "Submitting…" : "Confirm Signature"}
            </Button>
            <Button variant="outline" size="md" onClick={() => sigRef.current?.clear()}>
              Clear
            </Button>
          </div>
        </div>
      ) : (
        <div className="text-center py-16 opacity-35">
          <p>This proposal is not yet open for signing.</p>
        </div>
      )}
    </Section>
  );
}
