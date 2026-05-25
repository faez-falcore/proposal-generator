"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import type { AnimatedProposal, TermsClause, TimelineNode, ScopeItem } from "@/types/animated-proposal";
import type { ProposalCard } from "@/types/animated-proposal";
import { ICON_KEY_OPTIONS } from "@/lib/animated-icons";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, ChevronDown, ChevronRight } from "lucide-react";

interface Props {
  proposal: AnimatedProposal;
  packages: any[];
  tosTemplates: any[];
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-text-muted uppercase tracking-wide mb-1">{label}</label>
      {children}
      {error && <p className="text-semantic-error text-xs mt-1">{error}</p>}
    </div>
  );
}

function Input({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <input
      type="text"
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full px-3 py-2 bg-surface-elevated border border-border-primary text-text-primary rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-border-focus"
    />
  );
}

function Textarea({ value, onChange, rows = 3 }: { value: string; onChange: (v: string) => void; rows?: number }) {
  return (
    <textarea
      value={value}
      onChange={e => onChange(e.target.value)}
      rows={rows}
      className="w-full px-3 py-2 bg-surface-elevated border border-border-primary text-text-primary rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-border-focus resize-y"
    />
  );
}

function IconKeySelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="w-full px-3 py-2 bg-surface-elevated border border-border-primary text-text-primary rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-border-focus"
    >
      <option value="">No icon</option>
      {ICON_KEY_OPTIONS.map(o => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}

function Section({ title, children, defaultOpen = true }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-border-primary rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-4 bg-surface-secondary hover:bg-surface-elevated text-left transition-colors"
      >
        <span className="font-semibold text-text-primary">{title}</span>
        {open ? <ChevronDown size={16} className="text-text-muted" /> : <ChevronRight size={16} className="text-text-muted" />}
      </button>
      {open && <div className="px-5 py-5 space-y-4 bg-surface-primary">{children}</div>}
    </div>
  );
}

function CardEditor({ value, onChange, label }: { value: ProposalCard; onChange: (v: ProposalCard) => void; label: string }) {
  return (
    <div className="p-4 border border-border-secondary rounded-lg bg-surface-elevated space-y-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">{label}</p>
      <Field label="Title">
        <Input value={value.title} onChange={v => onChange({ ...value, title: v })} />
      </Field>
      <Field label="Description">
        <Textarea value={value.desc} onChange={v => onChange({ ...value, desc: v })} rows={2} />
      </Field>
      <Field label="Icon Key">
        <IconKeySelect value={value.icon_key ?? ""} onChange={v => onChange({ ...value, icon_key: v || undefined })} />
      </Field>
    </div>
  );
}

export function AnimatedProposalForm({ proposal, packages, tosTemplates }: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [brand, setBrand] = useState<"xma" | "xma_media">(proposal.brand);
  const [clientFirstName, setClientFirstName] = useState(proposal.client_first_name);
  const [clientFullName, setClientFullName] = useState(proposal.client_full_name);
  const [companyName, setCompanyName] = useState(proposal.company_name);
  const [projectTitle, setProjectTitle] = useState(proposal.project_title);
  const [providerName, setProviderName] = useState(proposal.provider_name);
  const [agencyName, setAgencyName] = useState(proposal.agency_name);
  const [proposalDate, setProposalDate] = useState(proposal.proposal_date ?? "");

  const [introParagraph, setIntroParagraph] = useState(proposal.intro_paragraph);
  const [challengeIntro, setChallengeIntro] = useState(proposal.challenge_intro);
  const [solutionIntro, setSolutionIntro] = useState(proposal.solution_intro);
  const [guaranteeText, setGuaranteeText] = useState(proposal.guarantee_text ?? "");
  const [phaseTwoTeaser, setPhaseTwoTeaser] = useState(proposal.phase_two_teaser ?? "");

  const [problems, setProblems] = useState<ProposalCard[]>(proposal.problems);
  const [solutions, setSolutions] = useState<ProposalCard[]>(proposal.solutions);

  const [scopePhaseName, setScopePhaseName] = useState(proposal.scope_phase_name ?? "");
  const [scopeSubtitle, setScopeSubtitle] = useState(proposal.scope_subtitle ?? "");
  const [scopeItems, setScopeItems] = useState<ScopeItem[]>(proposal.scope_items);

  const [timelineNodes, setTimelineNodes] = useState<TimelineNode[]>(proposal.timeline_nodes);

  const [retainerBullets, setRetainerBullets] = useState<string[]>(proposal.retainer_bullets ?? []);

  const [totalPriceCents, setTotalPriceCents] = useState(String(proposal.total_price_cents / 100));
  const [milestoneCents, setMilestoneCents] = useState(proposal.milestone_cents ? String(proposal.milestone_cents / 100) : "");
  const [retainerPriceCents, setRetainerPriceCents] = useState(proposal.retainer_price_cents ? String(proposal.retainer_price_cents / 100) : "");
  const [currency, setCurrency] = useState(proposal.currency);
  const [totalDays, setTotalDays] = useState(proposal.total_days ? String(proposal.total_days) : "");

  const [terms, setTerms] = useState<TermsClause[]>(proposal.terms ?? []);
  const [selectedTosTemplate, setSelectedTosTemplate] = useState<string>("");

  const [packageId, setPackageId] = useState(proposal.package_id ?? "");
  const [tosTemplateId, setTosTemplateId] = useState(proposal.tos_template_id ?? "");
  const [stripeLink, setStripeLink] = useState(proposal.stripe_link ?? "");

  function loadTosTemplate(templateId: string) {
    if (!templateId) return;
    const tpl = tosTemplates.find(t => t.id === templateId);
    if (!tpl) return;
    const raw = tpl.terms ?? [];
    const clauses: TermsClause[] = raw.map((c: any) => ({
      clause_no: c.clause_no ?? c.number ?? "",
      title: c.title ?? "",
      body: c.body ?? c.content ?? "",
    }));
    setTerms(clauses);
    setTosTemplateId(templateId);
  }

  async function handleSave() {
    setSaving(true);
    setSaveError(null);
    try {
      const toInt = (s: string) => s ? Math.round(parseFloat(s) * 100) : null;

      const payload = {
        brand,
        client_first_name: clientFirstName,
        client_full_name: clientFullName,
        company_name: companyName,
        project_title: projectTitle,
        provider_name: providerName,
        agency_name: agencyName,
        proposal_date: proposalDate || undefined,
        intro_paragraph: introParagraph,
        challenge_intro: challengeIntro,
        solution_intro: solutionIntro,
        guarantee_text: guaranteeText || null,
        phase_two_teaser: phaseTwoTeaser || null,
        problems,
        solutions,
        scope_phase_name: scopePhaseName || null,
        scope_subtitle: scopeSubtitle || null,
        scope_items: scopeItems,
        timeline_nodes: timelineNodes,
        retainer_bullets: retainerBullets,
        total_price_cents: Math.round(parseFloat(totalPriceCents) * 100),
        milestone_cents: toInt(milestoneCents),
        retainer_price_cents: toInt(retainerPriceCents),
        currency,
        total_days: totalDays ? parseInt(totalDays) : null,
        terms,
        package_id: packageId || null,
        tos_template_id: tosTemplateId || null,
        stripe_link: stripeLink || null,
        expires_at: null,
      };

      await axios.patch(`/api/animated-proposals/${proposal.id}`, payload);
      router.push("/proposals");
    } catch (e: any) {
      setSaveError(e?.response?.data?.error ? JSON.stringify(e.response.data.error) : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  const filteredPackages = packages.filter(p => !brand || p.brand === brand || !p.brand);

  return (
    <div className="space-y-4">
      <Section title="Client & Brand">
        <div className="flex gap-3">
          {(["xma", "xma_media"] as const).map(b => (
            <button
              key={b}
              type="button"
              onClick={() => setBrand(b)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${brand === b ? "bg-brand-primary text-white" : "bg-surface-elevated text-text-muted hover:text-text-primary border border-border-primary"}`}
            >
              {b === "xma" ? "XMA Agency" : "XMA Media"}
            </button>
          ))}
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <Field label="Client First Name"><Input value={clientFirstName} onChange={setClientFirstName} /></Field>
          <Field label="Client Full Name"><Input value={clientFullName} onChange={setClientFullName} /></Field>
          <Field label="Company Name"><Input value={companyName} onChange={setCompanyName} /></Field>
          <Field label="Project Title"><Input value={projectTitle} onChange={setProjectTitle} /></Field>
          <Field label="Provider Name"><Input value={providerName} onChange={setProviderName} /></Field>
          <Field label="Agency Name"><Input value={agencyName} onChange={setAgencyName} /></Field>
          <Field label="Proposal Date (YYYY-MM-DD)">
            <Input value={proposalDate} onChange={setProposalDate} placeholder="2026-04-27" />
          </Field>
        </div>
      </Section>

      <Section title="Copy & Narrative">
        <Field label="Intro Paragraph"><Textarea value={introParagraph} onChange={setIntroParagraph} rows={4} /></Field>
        <Field label="Challenge Intro"><Textarea value={challengeIntro} onChange={setChallengeIntro} /></Field>
        <Field label="Solution Intro"><Textarea value={solutionIntro} onChange={setSolutionIntro} /></Field>
        <Field label="Guarantee Text"><Textarea value={guaranteeText} onChange={setGuaranteeText} /></Field>
        <Field label="Phase Two Teaser"><Textarea value={phaseTwoTeaser} onChange={setPhaseTwoTeaser} /></Field>
      </Section>

      <Section title="Problems (3 cards)">
        {problems.map((card, i) => (
          <CardEditor
            key={i}
            label={`Problem ${i + 1}`}
            value={card}
            onChange={updated => setProblems(prev => prev.map((c, j) => j === i ? updated : c))}
          />
        ))}
      </Section>

      <Section title="Solutions (3 cards)">
        {solutions.map((card, i) => (
          <CardEditor
            key={i}
            label={`Solution ${i + 1}`}
            value={card}
            onChange={updated => setSolutions(prev => prev.map((c, j) => j === i ? updated : c))}
          />
        ))}
      </Section>

      <Section title="Scope">
        <div className="grid md:grid-cols-2 gap-4">
          <Field label="Phase Name"><Input value={scopePhaseName} onChange={setScopePhaseName} placeholder="Phase 1: Foundation" /></Field>
          <Field label="Phase Subtitle"><Input value={scopeSubtitle} onChange={setScopeSubtitle} /></Field>
        </div>
        {scopeItems.map((item, i) => (
          <div key={i} className="p-4 border border-border-secondary rounded-lg bg-surface-elevated space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">Scope Item {i + 1}</p>
              <button type="button" onClick={() => setScopeItems(prev => prev.filter((_, j) => j !== i))} className="text-semantic-error hover:opacity-70">
                <Trash2 size={14} />
              </button>
            </div>
            <Field label="Title"><Input value={item.title} onChange={v => setScopeItems(prev => prev.map((s, j) => j === i ? { ...s, title: v } : s))} /></Field>
            <Field label="Description"><Textarea value={item.desc} onChange={v => setScopeItems(prev => prev.map((s, j) => j === i ? { ...s, desc: v } : s))} rows={2} /></Field>
            <Field label="Icon Key"><IconKeySelect value={item.icon_key ?? ""} onChange={v => setScopeItems(prev => prev.map((s, j) => j === i ? { ...s, icon_key: v || undefined } : s))} /></Field>
          </div>
        ))}
        <button
          type="button"
          onClick={() => setScopeItems(prev => [...prev, { title: "", desc: "", icon_key: undefined }])}
          className="flex items-center gap-2 text-sm text-brand-primary hover:opacity-70 transition-opacity"
        >
          <Plus size={14} /> Add Scope Item
        </button>
      </Section>

      <Section title="Timeline">
        {timelineNodes.map((node, i) => (
          <div key={i} className="p-4 border border-border-secondary rounded-lg bg-surface-elevated space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">Phase {i + 1}</p>
              <button type="button" onClick={() => setTimelineNodes(prev => prev.filter((_, j) => j !== i))} className="text-semantic-error hover:opacity-70">
                <Trash2 size={14} />
              </button>
            </div>
            <div className="grid md:grid-cols-2 gap-3">
              <Field label="Label"><Input value={node.label} onChange={v => setTimelineNodes(prev => prev.map((n, j) => j === i ? { ...n, label: v } : n))} /></Field>
              <Field label="Days">
                <input type="number" min={1} value={node.days} onChange={e => setTimelineNodes(prev => prev.map((n, j) => j === i ? { ...n, days: parseInt(e.target.value) || 1 } : n))}
                  className="w-full px-3 py-2 bg-surface-elevated border border-border-primary text-text-primary rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-border-focus" />
              </Field>
            </div>
            <Field label="Description"><Textarea value={node.desc} onChange={v => setTimelineNodes(prev => prev.map((n, j) => j === i ? { ...n, desc: v } : n))} rows={2} /></Field>
          </div>
        ))}
        <button
          type="button"
          onClick={() => setTimelineNodes(prev => [...prev, { label: "", days: 14, desc: "" }])}
          className="flex items-center gap-2 text-sm text-brand-primary hover:opacity-70 transition-opacity"
        >
          <Plus size={14} /> Add Phase
        </button>
      </Section>

      <Section title="Retainer Bullets" defaultOpen={false}>
        {retainerBullets.map((bullet, i) => (
          <div key={i} className="flex gap-2">
            <Input value={bullet} onChange={v => setRetainerBullets(prev => prev.map((b, j) => j === i ? v : b))} placeholder="Bullet point" />
            <button type="button" onClick={() => setRetainerBullets(prev => prev.filter((_, j) => j !== i))} className="text-semantic-error hover:opacity-70 shrink-0">
              <Trash2 size={14} />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => setRetainerBullets(prev => [...prev, ""])}
          className="flex items-center gap-2 text-sm text-brand-primary hover:opacity-70"
        >
          <Plus size={14} /> Add Bullet
        </button>
      </Section>

      <Section title="Pricing">
        <div className="grid md:grid-cols-2 gap-4">
          <Field label={`Total Price (${currency})`}>
            <input type="number" min={0} step={0.01} value={totalPriceCents} onChange={e => setTotalPriceCents(e.target.value)}
              className="w-full px-3 py-2 bg-surface-elevated border border-border-primary text-text-primary rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-border-focus" />
          </Field>
          <Field label="Milestone Amount">
            <input type="number" min={0} step={0.01} value={milestoneCents} onChange={e => setMilestoneCents(e.target.value)}
              className="w-full px-3 py-2 bg-surface-elevated border border-border-primary text-text-primary rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-border-focus" />
          </Field>
          <Field label="Monthly Retainer">
            <input type="number" min={0} step={0.01} value={retainerPriceCents} onChange={e => setRetainerPriceCents(e.target.value)}
              className="w-full px-3 py-2 bg-surface-elevated border border-border-primary text-text-primary rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-border-focus" />
          </Field>
          <Field label="Currency">
            <select value={currency} onChange={e => setCurrency(e.target.value)}
              className="w-full px-3 py-2 bg-surface-elevated border border-border-primary text-text-primary rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-border-focus">
              <option value="AED">AED</option>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
            </select>
          </Field>
          <Field label="Total Days">
            <input type="number" min={1} value={totalDays} onChange={e => setTotalDays(e.target.value)}
              className="w-full px-3 py-2 bg-surface-elevated border border-border-primary text-text-primary rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-border-focus" />
          </Field>
        </div>
      </Section>

      <Section title="Terms & Conditions">
        <div className="flex items-center gap-3 flex-wrap">
          <select
            value={selectedTosTemplate}
            onChange={e => setSelectedTosTemplate(e.target.value)}
            className="px-3 py-2 bg-surface-elevated border border-border-primary text-text-primary rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-border-focus"
          >
            <option value="">Pick a T&C template…</option>
            {tosTemplates.map(t => (
              <option key={t.id} value={t.id}>{t.name} ({t.brand ?? "any"})</option>
            ))}
          </select>
          <Button type="button" variant="outline" size="sm" onClick={() => loadTosTemplate(selectedTosTemplate)} disabled={!selectedTosTemplate}>
            Load Template
          </Button>
          <span className="text-xs text-text-muted">Loading a template replaces all current clauses.</span>
        </div>
        {terms.map((clause, i) => (
          <div key={i} className="p-4 border border-border-secondary rounded-lg bg-surface-elevated space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">Clause {i + 1}</p>
              <button type="button" onClick={() => setTerms(prev => prev.filter((_, j) => j !== i))} className="text-semantic-error hover:opacity-70">
                <Trash2 size={14} />
              </button>
            </div>
            <div className="grid md:grid-cols-2 gap-3">
              <Field label="Clause No."><Input value={clause.clause_no} onChange={v => setTerms(prev => prev.map((c, j) => j === i ? { ...c, clause_no: v } : c))} placeholder="01" /></Field>
              <Field label="Title"><Input value={clause.title} onChange={v => setTerms(prev => prev.map((c, j) => j === i ? { ...c, title: v } : c))} /></Field>
            </div>
            <Field label="Body"><Textarea value={clause.body} onChange={v => setTerms(prev => prev.map((c, j) => j === i ? { ...c, body: v } : c))} rows={4} /></Field>
          </div>
        ))}
        <button
          type="button"
          onClick={() => setTerms(prev => [...prev, { clause_no: String(prev.length + 1).padStart(2, "0"), title: "", body: "" }])}
          className="flex items-center gap-2 text-sm text-brand-primary hover:opacity-70"
        >
          <Plus size={14} /> Add Clause
        </button>
      </Section>

      <Section title="Package & References" defaultOpen={false}>
        <Field label="Package">
          <select value={packageId} onChange={e => setPackageId(e.target.value)}
            className="w-full px-3 py-2 bg-surface-elevated border border-border-primary text-text-primary rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-border-focus">
            <option value="">No package (custom)</option>
            {filteredPackages.map(p => (
              <option key={p.id} value={p.id}>{p.name} — {p.currency} {p.price?.toLocaleString()}</option>
            ))}
          </select>
        </Field>
        <Field label="T&C Template Reference">
          <select value={tosTemplateId} onChange={e => setTosTemplateId(e.target.value)}
            className="w-full px-3 py-2 bg-surface-elevated border border-border-primary text-text-primary rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-border-focus">
            <option value="">None</option>
            {tosTemplates.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </Field>
      </Section>

      <Section title="Meta" defaultOpen={false}>
        <Field label="Stripe Payment Link"><Input value={stripeLink} onChange={setStripeLink} placeholder="https://buy.stripe.com/…" /></Field>
      </Section>

      {saveError && (
        <div className="px-4 py-3 rounded-lg text-sm bg-semantic-error/10 border border-semantic-error/30 text-semantic-error">
          {saveError}
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Saving…" : "Save Changes"}
        </Button>
        <Button variant="outline" onClick={() => router.push("/proposals")}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
