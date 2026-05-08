"use client";

import React, { useState } from "react";
import { FileDown, Loader2 } from "lucide-react";
import { pdf } from "@react-pdf/renderer";
import { PrintableAnimatedProposalPDF } from "./PrintableAnimatedProposalPDF";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { VariantProps } from "class-variance-authority";
import { buttonVariants } from "@/components/ui/button";
import type { AnimatedProposal } from "@/types/animated-proposal";

interface Props extends VariantProps<typeof buttonVariants> {
  proposal: AnimatedProposal;
  className?: string;
}

export function AnimatedPrintButton({
  proposal,
  variant = "outline",
  size = "sm",
  className,
}: Props) {
  const [loading, setLoading] = useState(false);

  async function handleDownload() {
    setLoading(true);
    try {
      const blob = await pdf(
        <PrintableAnimatedProposalPDF proposal={proposal} />
      ).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `XMA_Proposal_${proposal.company_name.replace(/\s+/g, "_")}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      variant={variant}
      size={size}
      className={cn(className)}
      onClick={handleDownload}
      disabled={loading}
    >
      {loading ? (
        <>
          <Loader2 size={14} className="animate-spin" />
          <span>Generating…</span>
        </>
      ) : (
        <>
          <FileDown size={14} />
          <span>Download PDF</span>
        </>
      )}
    </Button>
  );
}
