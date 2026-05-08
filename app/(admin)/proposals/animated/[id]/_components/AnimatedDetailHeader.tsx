"use client";

import Link from "next/link";
import { Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UnifiedStatusPill } from "@/components/proposal/UnifiedStatusPill";
import { BrandTag } from "@/components/proposal/BrandTag";
import { AnimatedPrintButton } from "@/components/animated-proposal/AnimatedPrintButton";
import type { AnimatedProposal } from "@/types/animated-proposal";

interface Props {
  proposal: AnimatedProposal;
  id: string;
  isAdmin: boolean;
  statusChanging: boolean;
  archiving: boolean;
  copiedLink: boolean;
  onStatusChange: (status: string) => void;
  onArchive: () => void;
  onCopyLink: () => void;
  onPreview: () => void;
}

export function AnimatedDetailHeader({
  proposal,
  id,
  isAdmin,
  statusChanging,
  archiving,
  copiedLink,
  onStatusChange,
  onArchive,
  onCopyLink,
  onPreview,
}: Props) {
  return (
    <div className="mb-8">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-3 flex-wrap mb-1">
            <h1 className="text-2xl font-bold">{proposal.project_title}</h1>
            <BrandTag brand={proposal.brand} size="sm" />
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold tracking-wide uppercase bg-blue-500/10 text-blue-400 border border-blue-500/20">
              Animated
            </span>
          </div>
          <p className="text-text-muted text-sm">{proposal.client_full_name} · {proposal.company_name}</p>
        </div>
        <div className="flex items-center gap-3">
          <UnifiedStatusPill kind="animated" status={proposal.status} />
          {isAdmin && (
            <select
              value={proposal.status}
              disabled={statusChanging}
              onChange={(e) => onStatusChange(e.target.value)}
              aria-label="Change proposal status"
              className="text-xs rounded-md border border-border-primary bg-surface-elevated text-text-primary px-2 py-1 disabled:opacity-50 cursor-pointer"
            >
              {["sent", "client_signed", "counter_signed", "paid", "archived"].map((s) => (
                <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-3 mt-4">
        <Button variant="outline" size="sm" onClick={onCopyLink}>
          {copiedLink ? "Copied!" : "Copy Public Link"}
        </Button>
        <Button variant="outline" size="sm" onClick={onPreview}>
          Preview →
        </Button>
        <AnimatedPrintButton proposal={proposal} isXmaMedia={proposal.brand === "xma_media"} />
        <Link href={`/proposals/animated/${id}/edit`}>
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <Edit size={14} />
            Edit
          </Button>
        </Link>
        {isAdmin && !["archived", "paid"].includes(proposal.status) && (
          <Button variant="outline" size="sm" onClick={onArchive} disabled={archiving}>
            {archiving ? "Archiving…" : "Archive"}
          </Button>
        )}
      </div>
    </div>
  );
}
