"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import { format } from "date-fns";
import { useAuth } from "@/components/auth/AuthProvider";
import type { AnimatedProposal, AnimatedProposalEvent } from "@/types/animated-proposal";
import { AnimatedDetailHeader } from "./_components/AnimatedDetailHeader";
import { CounterSignPanel } from "./_components/CounterSignPanel";
import { EventsPanel } from "./_components/EventsPanel";
import ConfirmationDialog from "@/components/ui/ConfirmationDialog";
import { Archive } from "lucide-react";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "";

function fmtPrice(cents: number, currency: string) {
  return new Intl.NumberFormat("en-AE", { style: "currency", currency, minimumFractionDigits: 0 }).format(cents / 100);
}

export default function AnimatedProposalDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { userRole } = useAuth();
  const [proposal, setProposal] = useState<AnimatedProposal | null>(null);
  const [events, setEvents] = useState<AnimatedProposalEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [counterSigning, setCounterSigning] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [statusChanging, setStatusChanging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const [{ data: prop }, { data: evData }] = await Promise.all([
        axios.get(`/api/animated-proposals/${id}`),
        axios.get(`/api/animated-proposals/${id}/events`).catch(() => ({ data: { data: [] } })),
      ]);
      setProposal(prop);
      setEvents(evData.data ?? []);
    } catch {
      setError("Failed to load proposal");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [id]);

  async function handleStatusChange(newStatus: string) {
    setStatusChanging(true);
    setError(null);
    try {
      const { data } = await axios.patch(`/api/animated-proposals/${id}`, { status: newStatus });
      setProposal(data);
    } catch (err) {
      const e = err as { response?: { data?: { error?: string } } };
      setError(e?.response?.data?.error ?? "Status update failed");
    } finally {
      setStatusChanging(false);
    }
  }

  async function handleArchiveConfirm() {
    setArchiving(true);
    try {
      await axios.post(`/api/animated-proposals/${id}/archive`);
      router.push("/proposals");
    } catch (err) {
      const e = err as { response?: { data?: { error?: string } } };
      setError(e?.response?.data?.error ?? "Archive failed");
      setArchiving(false);
      setArchiveDialogOpen(false);
    }
  }

  async function handleCounterSign(pngData: string) {
    setCounterSigning(true);
    setError(null);
    try {
      await axios.post(`/api/animated-proposals/${id}/sign/provider`, { signature_png_base64: pngData });
      await load();
    } catch (err) {
      const e = err as { response?: { data?: { error?: string } } };
      setError(e?.response?.data?.error ?? "Counter-sign failed");
    } finally {
      setCounterSigning(false);
    }
  }

  async function copyLink() {
    if (!proposal) return;
    await navigator.clipboard.writeText(`${BASE_URL}/proposal/${proposal.token}`);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  }

  if (loading) {
    return (
      <div className="bg-surface-primary min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 rounded-full border-4 border-brand-primary border-t-transparent" />
      </div>
    );
  }

  if (!proposal) {
    return (
      <div className="bg-surface-primary min-h-screen flex items-center justify-center">
        <p className="text-text-muted">{error ?? "Proposal not found"}</p>
      </div>
    );
  }

  const isAdmin = userRole === "admin";
  const publicLink = `${BASE_URL}/proposal/${proposal.token}`;

  return (
    <div className="bg-surface-primary min-h-screen px-6 md:px-10 py-10">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 text-sm text-text-muted mb-8">
          <button onClick={() => router.push("/proposals")} className="hover:text-text-primary transition-colors">
            ← All Proposals
          </button>
          <span>/</span>
          <span>{proposal.company_name}</span>
        </div>

        {error && (
          <div className="mb-6 px-4 py-3 rounded-lg text-sm bg-semantic-error/10 border border-semantic-error/30 text-semantic-error">
            {error}
          </div>
        )}

        <AnimatedDetailHeader
          proposal={proposal}
          id={id}
          isAdmin={isAdmin}
          statusChanging={statusChanging}
          archiving={archiving}
          copiedLink={copiedLink}
          onStatusChange={handleStatusChange}
          onArchive={() => setArchiveDialogOpen(true)}
          onCopyLink={copyLink}
          onPreview={() => window.open(`${publicLink}?preview=1`, "_blank")}
        />

        <div className="grid md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Order ID", value: proposal.order_id ?? "—" },
            { label: "Total Value", value: fmtPrice(proposal.total_price_cents, proposal.currency) },
            { label: "Created", value: format(new Date(proposal.created_at), "dd MMM yyyy") },
            { label: "Brand", value: proposal.brand === "xma_media" ? "XMA Media" : "XMA Agency" },
          ].map(({ label, value }) => (
            <div key={label} className="bg-surface-elevated rounded-lg px-5 py-4">
              <p className="text-xs uppercase tracking-wide text-text-muted mb-1">{label}</p>
              <p className="font-semibold">{value}</p>
            </div>
          ))}
        </div>

        {proposal.status === "client_signed" && (
          <CounterSignPanel
            counterSigning={counterSigning}
            onSubmit={handleCounterSign}
            onError={(msg) => setError(msg)}
          />
        )}

        {proposal.stripe_link && (
          <div className="mb-8 border border-border-primary rounded-lg p-6">
            <h3 className="font-bold mb-2">Stripe Payment Link</h3>
            <a
              href={proposal.stripe_link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm break-all text-brand-primary hover:opacity-70 transition-opacity"
            >
              {proposal.stripe_link}
            </a>
          </div>
        )}

        <EventsPanel events={events} />
      </div>

      <ConfirmationDialog
        isOpen={archiveDialogOpen}
        title="Archive Proposal"
        message="Archive this proposal? It will be hidden from active lists."
        confirmText="Archive"
        cancelText="Cancel"
        onConfirm={handleArchiveConfirm}
        onCancel={() => setArchiveDialogOpen(false)}
        isProcessing={archiving}
        icon={<Archive size={24} />}
      />
    </div>
  );
}
