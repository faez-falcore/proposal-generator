"use client";

import { useRef, useState } from "react";
import SignatureCanvas from "react-signature-canvas";
import axios from "axios";
import posthog from "posthog-js";
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
  brand?: string;
}

export function SignatureSection({ proposalId, clientSignedAt, stripeLink, status, brand }: Props) {
  const sigRef = useRef<SignatureCanvas>(null);
  const [signing, setSigning] = useState(false);
  const [signed, setSigned] = useState(!!clientSignedAt);
  const [error, setError] = useState<string | null>(null);
  const [accentColor, sectionRef] = useAccentColor();

  const isPaid = status === "paid";
  const canSign = status === "sent" && !signed;
  const showStripe = signed && !!stripeLink && !isPaid;

  async function handleSign() {
    if (!sigRef.current || sigRef.current.isEmpty()) {
      setError("Please draw your signature first.");
      return;
    }
    setSigning(true);
    setError(null);
    try {
      const pngData = sigRef.current.getCanvas().toDataURL("image/png");
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
        <div className="py-16">
          <div className="text-center mb-12">
            <div
              className="mb-6"
              style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: "3rem", color: "var(--accent)" }}
            >
              ✓
            </div>
            <h2 className="mb-4" style={{ fontFamily: "var(--font-body)", fontSize: "var(--fs-h2)", fontWeight: 700 }}>
              {isPaid ? "Payment Received" : "Proposal Signed"}
            </h2>
            <p className="opacity-55 mb-10 text-base">
              {isPaid
                ? "Your payment has been received. We'll be in touch to kick things off."
                : "Your signature has been received. We'll be in touch shortly."}
            </p>
            {showStripe && (
              <a
                href={stripeLink}
                target="_blank"
                rel="noopener noreferrer"
                className={animButtonVariants({ size: "lg" })}
                style={{ background: "var(--accent)" }}
                onClick={() => {
                  posthog.capture("proposal_stripe_link_clicked", { proposal_id: proposalId });
                  axios.post(`/api/animated-proposals/${proposalId}/events`, { event_type: "stripe_click" }).catch(() => {});
                }}
              >
                Confirm & Make Payment →
              </a>
            )}
          </div>

          <div
            className="rounded-[var(--r-card-lg)] p-6 md:p-8"
            style={{ border: "1px solid oklch(from var(--fg) l c h / 0.1)", background: "oklch(from var(--fg) l c h / 0.03)" }}
          >
            <p
              className="uppercase tracking-widest text-xs mb-6"
              style={{ opacity: 0.4, letterSpacing: "0.18em" }}
            >
              Bank Transfer Details
            </p>
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                { label: "Account Holder", value: "XLUXIVE DIGITAL MARKETING L.L.C" },
                { label: "IBAN", value: "AE590860000009339072484" },
                { label: "BIC / SWIFT", value: "WIOBAEADXXX" },
                { label: "Address", value: "The Curve Building M44, Dubai, UAE" },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="text-xs uppercase tracking-wider mb-1" style={{ opacity: 0.4 }}>{label}</p>
                  <p className="font-medium text-sm" style={{ fontFamily: "var(--font-body)" }}>{value}</p>
                </div>
              ))}
            </div>
          </div>
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

          <div
            className="mt-10 pt-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
            style={{ borderTop: "1px solid oklch(from var(--fg) l c h / 0.1)" }}
          >
            <div className="flex-1">
              <p className="text-sm font-semibold mb-2" style={{ opacity: 0.8 }}>Legal Agreement</p>
              <p className="text-sm leading-relaxed" style={{ opacity: 0.5 }}>
                By signing this proposal, you agree to enter into a legally binding contract with{" "}
                {brand === "xma_media" ? "XMA Media" : "xluxive digital marketing LLC"}.
                This document serves as the official agreement between both parties and is subject
                to the terms and conditions outlined herein.
              </p>
              <p className="text-sm mt-2 leading-relaxed" style={{ opacity: 0.5 }}>
                <span style={{ opacity: 1, fontWeight: 600 }}>Payment Acceptance:</span>{" "}
                Receipt of payment constitutes full acceptance of all terms. Work commences according to the agreed timeline.
              </p>
            </div>
            <div className="flex flex-col items-center shrink-0">
              <div className="bg-white p-2 rounded-lg">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/xma-company-stamp.png" alt="Company Stamp" className="w-36 h-auto" />
              </div>
              <p className="mt-2 text-xs" style={{ opacity: 0.3 }}>Official Company Stamp</p>
            </div>
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
