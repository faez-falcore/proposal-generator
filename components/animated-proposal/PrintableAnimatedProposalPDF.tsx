import React from "react";
import {
  StyleSheet,
  Document,
  Page,
  Text,
  View,
  Image,
} from "@react-pdf/renderer";
import type {
  AnimatedProposal,
  ProposalCard,
  ScopeItem,
  TimelineNode,
  TermsClause,
} from "@/types/animated-proposal";

interface Props {
  proposal: AnimatedProposal;
}

const xmaInfo = {
  name: "Amir Mahdi Banki",
  title: "CEO, XLUXIVE DIGITAL MARKETING LLC",
  email: "admin@xma.ae",
  phone: "+971 50 810 7712",
};

// Hex approximations of the animated proposal's oklch tokens
const THEME = {
  xma: {
    bg:        "#0D0D12", // oklch(0.08 0.005 270)
    cardBg:    "#161619", // slightly lighter
    elevBg:    "#1E1E23", // elevated cards
    fg:        "#F0EFE8", // oklch(0.94 0.005 100)
    fgMuted:   "#A8A89E", // dimmed fg
    fgSubtle:  "#6B6B64",
    accent:    "#E53E3E", // oklch(0.577 0.245 27.325)
    border:    "#2A2A30",
    logo:      "/XMA-White@2x.png",
    watermark: "/XMA-White@2x.png",
  },
  xmaMedia: {
    bg:        "#F5EDD9", // oklch(0.955 0.021 82)
    cardBg:    "#EDE4CA",
    elevBg:    "#E4D9BC",
    fg:        "#0D0D1A", // oklch(0.094 0.018 265)
    fgMuted:   "#4A4A52",
    fgSubtle:  "#7A7A80",
    accent:    "#7C3AED", // oklch(0.444 0.284 291)
    border:    "#D4C9AE",
    logo:      "/XMA-01@2x.png",
    watermark: "/XMA-01@2x.png",
  },
};

function formatCents(cents: number, currency: string): string {
  return (
    new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(cents / 100) +
    " " +
    currency
  );
}

function buildStyles(t: typeof THEME.xma) {
  return StyleSheet.create({
    page: {
      flexDirection: "column",
      backgroundColor: t.bg,
      padding: 35,
      fontFamily: "Helvetica",
      color: t.fg,
    },
    watermark: {
      position: "absolute",
      opacity: 0.03,
      transform: "rotate(-30deg)",
      width: "100%",
      height: "100%",
      alignItems: "center",
      justifyContent: "center",
    },
    watermarkImage: { width: 400 },

    // ── Header ──────────────────────────────────────────────────────
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-end",
      marginBottom: 24,
      paddingBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: t.accent,
      borderBottomStyle: "solid",
    },
    logo: { height: 32 },
    headerRight: { alignItems: "flex-end" },
    proposalEyebrow: {
      fontSize: 7,
      color: t.fgSubtle,
      letterSpacing: 2,
      marginBottom: 3,
    },
    proposalTitle: {
      fontSize: 16,
      fontFamily: "Helvetica-Bold",
      color: t.fg,
    },

    // ── Meta row ────────────────────────────────────────────────────
    metaRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 20,
      paddingBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: t.border,
      borderBottomStyle: "solid",
    },
    metaBlock: { flex: 1 },
    metaBlockRight: { flex: 1, alignItems: "flex-end" },
    metaLabel: {
      fontSize: 7,
      color: t.fgSubtle,
      letterSpacing: 1.5,
      marginBottom: 3,
    },
    metaValue: {
      fontSize: 10,
      fontFamily: "Helvetica-Bold",
      color: t.fg,
    },
    metaSub: {
      fontSize: 8,
      color: t.fgMuted,
      marginTop: 1,
    },

    // ── Ref ID ──────────────────────────────────────────────────────
    refId: {
      backgroundColor: t.cardBg,
      borderLeftWidth: 3,
      borderLeftColor: t.accent,
      borderLeftStyle: "solid",
      padding: 8,
      marginBottom: 18,
    },
    refIdText: {
      fontSize: 9,
      color: t.accent,
      fontFamily: "Helvetica-Bold",
    },

    // ── Sections ────────────────────────────────────────────────────
    section: { marginBottom: 18 },
    sectionTitle: {
      fontSize: 11,
      fontFamily: "Helvetica-Bold",
      color: t.accent,
      letterSpacing: 1.5,
      marginBottom: 8,
      paddingBottom: 5,
      borderBottomWidth: 1,
      borderBottomColor: t.border,
      borderBottomStyle: "solid",
    },
    bodyText: {
      fontSize: 9,
      lineHeight: 1.6,
      color: t.fgMuted,
    },

    // ── Cards (2-col grid) ───────────────────────────────────────────
    cardsRow: { flexDirection: "row", flexWrap: "wrap", marginTop: 6 },
    cardLeft: {
      width: "48%",
      marginRight: "4%",
      backgroundColor: t.cardBg,
      padding: 9,
      borderRadius: 3,
      marginBottom: 6,
    },
    cardRight: {
      width: "48%",
      backgroundColor: t.cardBg,
      padding: 9,
      borderRadius: 3,
      marginBottom: 6,
    },
    cardTitle: {
      fontSize: 9,
      fontFamily: "Helvetica-Bold",
      color: t.fg,
      marginBottom: 3,
    },
    cardDesc: {
      fontSize: 8,
      color: t.fgMuted,
      lineHeight: 1.5,
    },

    // ── Investment ──────────────────────────────────────────────────
    investBox: {
      backgroundColor: t.cardBg,
      borderRadius: 4,
      padding: 12,
      marginTop: 6,
    },
    investRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingVertical: 5,
      borderBottomWidth: 1,
      borderBottomColor: t.border,
      borderBottomStyle: "solid",
    },
    investLabel: { fontSize: 9, color: t.fgMuted },
    investValue: { fontSize: 9, fontFamily: "Helvetica-Bold", color: t.fg },
    investTotalRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingTop: 8,
      marginTop: 2,
    },
    investTotalLabel: { fontSize: 11, fontFamily: "Helvetica-Bold", color: t.fg },
    investTotalValue: { fontSize: 13, fontFamily: "Helvetica-Bold", color: t.accent },
    bullet: { flexDirection: "row", marginTop: 4 },
    bulletDot: { fontSize: 9, width: 12, color: t.accent },
    bulletText: { fontSize: 8, color: t.fgMuted, flex: 1, lineHeight: 1.4 },

    // ── Timeline ────────────────────────────────────────────────────
    timelineItem: {
      flexDirection: "row",
      marginBottom: 10,
      alignItems: "flex-start",
    },
    dot: {
      width: 18,
      height: 18,
      borderRadius: 9,
      backgroundColor: t.accent,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 10,
      marginTop: 1,
    },
    dotText: { fontSize: 7, color: "#FFFFFF", fontFamily: "Helvetica-Bold" },
    timelineBody: { flex: 1 },
    timelineLabel: {
      fontSize: 9,
      fontFamily: "Helvetica-Bold",
      color: t.fg,
      marginBottom: 2,
    },
    timelineDays: { fontSize: 7, color: t.accent, marginBottom: 2 },
    timelineDesc: { fontSize: 8, color: t.fgMuted, lineHeight: 1.4 },

    // ── Terms ───────────────────────────────────────────────────────
    termsBox: {
      backgroundColor: t.cardBg,
      padding: 10,
      borderRadius: 4,
      marginTop: 6,
    },
    termItem: {
      flexDirection: "row",
      marginBottom: 7,
      paddingBottom: 6,
      borderBottomWidth: 1,
      borderBottomColor: t.border,
      borderBottomStyle: "solid",
    },
    termClause: {
      fontSize: 8,
      fontFamily: "Helvetica-Bold",
      color: t.accent,
      width: 28,
    },
    termContent: { flex: 1 },
    termTitle: {
      fontSize: 8,
      fontFamily: "Helvetica-Bold",
      color: t.fg,
      marginBottom: 2,
    },
    termBody: { fontSize: 7, color: t.fgMuted, lineHeight: 1.4 },

    // ── Bank info ───────────────────────────────────────────────────
    bankBox: {
      backgroundColor: t.elevBg,
      padding: 10,
      borderRadius: 4,
      borderLeftWidth: 3,
      borderLeftColor: t.accent,
      borderLeftStyle: "solid",
      marginBottom: 10,
      marginTop: 20,
    },
    bankTitle: {
      fontSize: 9,
      fontFamily: "Helvetica-Bold",
      color: t.fg,
      marginBottom: 6,
    },
    bankGrid: { flexDirection: "row", flexWrap: "wrap" },
    bankItem: { width: "50%", marginBottom: 4 },
    bankLabel: { fontSize: 7, color: t.fgSubtle },
    bankValue: { fontSize: 8, color: t.fg },
    bankNote: { fontSize: 7, color: t.fgMuted, fontStyle: "italic", marginTop: 4 },

    // ── Signatures ──────────────────────────────────────────────────
    sigsRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginTop: 20,
    },
    sigBlock: { flex: 1, marginHorizontal: 8 },
    sigLabel: {
      fontSize: 8,
      fontFamily: "Helvetica-Bold",
      color: t.fg,
      marginBottom: 8,
    },
    sigImg: {
      width: 120,
      height: 48,
      objectFit: "contain",
      marginBottom: 4,
    },
    sigLine: {
      borderTopWidth: 1,
      borderTopColor: t.border,
      borderTopStyle: "solid",
      marginTop: 28,
      marginBottom: 5,
    },
    sigName: { fontSize: 8, fontFamily: "Helvetica-Bold", color: t.fg },
    sigMeta: { fontSize: 7, color: t.fgMuted, marginBottom: 2 },
    sigDate: { fontSize: 7, color: t.fgSubtle, marginTop: 1 },
    stamp: {
      position: "absolute",
      width: 110,
      height: 110,
      top: -8,
      right: -8,
      transform: "rotate(10deg)",
    },

    // ── Footer ──────────────────────────────────────────────────────
    footer: {
      marginTop: 20,
      paddingTop: 10,
      borderTopWidth: 1,
      borderTopColor: t.border,
      borderTopStyle: "solid",
      flexDirection: "row",
      justifyContent: "space-between",
    },
    footerText: { fontSize: 7, color: t.fgSubtle },
  });
}

function renderCards(cards: ProposalCard[], s: ReturnType<typeof buildStyles>) {
  return (
    <View style={s.cardsRow}>
      {cards.map((card, i) => (
        <View style={i % 2 === 0 ? s.cardLeft : s.cardRight} key={i}>
          <Text style={s.cardTitle}>{card.title}</Text>
          <Text style={s.cardDesc}>{card.desc}</Text>
        </View>
      ))}
    </View>
  );
}

function renderScope(items: ScopeItem[], s: ReturnType<typeof buildStyles>) {
  return (
    <View style={s.cardsRow}>
      {items.map((item, i) => (
        <View style={i % 2 === 0 ? s.cardLeft : s.cardRight} key={i}>
          <Text style={s.cardTitle}>{item.title}</Text>
          <Text style={s.cardDesc}>{item.desc}</Text>
        </View>
      ))}
    </View>
  );
}

function renderTimeline(nodes: TimelineNode[], s: ReturnType<typeof buildStyles>) {
  return nodes.map((node, i) => (
    <View style={s.timelineItem} key={i}>
      <View style={s.dot}>
        <Text style={s.dotText}>{i + 1}</Text>
      </View>
      <View style={s.timelineBody}>
        <Text style={s.timelineLabel}>{node.label}</Text>
        <Text style={s.timelineDays}>Day {node.days}</Text>
        <Text style={s.timelineDesc}>{node.desc}</Text>
      </View>
    </View>
  ));
}

function renderTerms(terms: TermsClause[], s: ReturnType<typeof buildStyles>) {
  return terms.map((term, i) => (
    <View style={s.termItem} key={i} wrap={false}>
      <Text style={s.termClause}>{term.clause_no}</Text>
      <View style={s.termContent}>
        <Text style={s.termTitle}>{term.title}</Text>
        <Text style={s.termBody}>{term.body}</Text>
      </View>
    </View>
  ));
}

export function PrintableAnimatedProposalPDF({ proposal }: Props) {
  const isXmaMedia = proposal.brand === "xma_media";
  const t = isXmaMedia ? THEME.xmaMedia : THEME.xma;
  const s = buildStyles(t);

  const formattedDate = new Date(proposal.proposal_date).toLocaleDateString("en-AE", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const proposalRef = proposal.order_id ?? proposal.slug.toUpperCase();

  return (
    <Document>
      <Page size="A4" style={s.page} wrap>
        <View style={s.watermark}>
          <Image src={t.watermark} style={s.watermarkImage} />
        </View>

        {/* Header */}
        <View style={s.header}>
          <Image src={t.logo} style={s.logo} />
          <View style={s.headerRight}>
            <Text style={s.proposalEyebrow}>PROPOSAL</Text>
            <Text style={s.proposalTitle}>{proposal.project_title}</Text>
          </View>
        </View>

        {/* Meta */}
        <View style={s.metaRow}>
          <View style={s.metaBlock}>
            <Text style={s.metaLabel}>PREPARED FOR</Text>
            <Text style={s.metaValue}>{proposal.client_full_name}</Text>
            <Text style={s.metaSub}>{proposal.company_name}</Text>
          </View>
          <View style={s.metaBlock}>
            <Text style={s.metaLabel}>PREPARED BY</Text>
            <Text style={s.metaValue}>{proposal.provider_name}</Text>
            <Text style={s.metaSub}>{proposal.agency_name}</Text>
          </View>
          <View style={s.metaBlockRight}>
            <Text style={s.metaLabel}>DATE</Text>
            <Text style={s.metaValue}>{formattedDate}</Text>
          </View>
        </View>

        {/* Ref ID */}
        <View style={s.refId}>
          <Text style={s.refIdText}>
            <Text style={{ fontFamily: "Helvetica-Bold" }}>Order ID / Contract Reference: </Text>
            {proposalRef}
          </Text>
        </View>

        {/* Intro */}
        <View style={s.section}>
          <Text style={s.bodyText}>{proposal.intro_paragraph}</Text>
        </View>

        {/* Investment Summary — upfront like classic */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>INVESTMENT SUMMARY</Text>
          <View style={s.investBox}>
            {proposal.milestone_cents != null && (
              <View style={s.investRow}>
                <Text style={s.investLabel}>Milestone Payment</Text>
                <Text style={s.investValue}>
                  {formatCents(proposal.milestone_cents, proposal.currency)}
                </Text>
              </View>
            )}
            {proposal.retainer_price_cents != null && (
              <View style={s.investRow}>
                <Text style={s.investLabel}>Monthly Retainer</Text>
                <Text style={s.investValue}>
                  {formatCents(proposal.retainer_price_cents, proposal.currency)}/mo
                </Text>
              </View>
            )}
            <View style={s.investTotalRow}>
              <Text style={s.investTotalLabel}>Total Investment</Text>
              <Text style={s.investTotalValue}>
                {formatCents(proposal.total_price_cents, proposal.currency)}
              </Text>
            </View>
          </View>
          {proposal.retainer_bullets.map((b, i) => (
            <View style={s.bullet} key={i}>
              <Text style={s.bulletDot}>•</Text>
              <Text style={s.bulletText}>{b}</Text>
            </View>
          ))}
        </View>

        {/* Challenge */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>THE CHALLENGE</Text>
          <Text style={s.bodyText}>{proposal.challenge_intro}</Text>
          {renderCards(proposal.problems, s)}
        </View>

        {/* Solution */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>OUR SOLUTION</Text>
          <Text style={s.bodyText}>{proposal.solution_intro}</Text>
          {renderCards(proposal.solutions, s)}
        </View>

        {/* Scope */}
        {proposal.scope_items.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>
              {(proposal.scope_phase_name ?? "SCOPE OF WORK").toUpperCase()}
            </Text>
            {proposal.scope_subtitle ? (
              <Text style={[s.bodyText, { marginBottom: 6 }]}>{proposal.scope_subtitle}</Text>
            ) : null}
            {renderScope(proposal.scope_items, s)}
          </View>
        )}

        {/* Timeline */}
        {proposal.timeline_nodes.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>
              PROJECT TIMELINE
              {proposal.total_days ? ` — ${proposal.total_days} BUSINESS DAYS` : ""}
            </Text>
            {renderTimeline(proposal.timeline_nodes, s)}
          </View>
        )}

        {/* Guarantee */}
        {proposal.guarantee_text && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>OUR GUARANTEE</Text>
            <Text style={s.bodyText}>{proposal.guarantee_text}</Text>
            {proposal.phase_two_teaser && (
              <Text style={[s.bodyText, { marginTop: 6, fontStyle: "italic" }]}>
                {proposal.phase_two_teaser}
              </Text>
            )}
          </View>
        )}

        {/* Terms */}
        {proposal.terms.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>TERMS &amp; CONDITIONS</Text>
            <View style={s.termsBox}>
              {renderTerms(proposal.terms, s)}
            </View>
          </View>
        )}

        {/* Bank info */}
        <View style={s.bankBox}>
          <Text style={s.bankTitle}>Payment Information</Text>
          <View style={s.bankGrid}>
            <View style={s.bankItem}>
              <Text style={s.bankLabel}>Account Holder</Text>
              <Text style={s.bankValue}>XLUXIVE DIGITAL MARKETING L.L.C</Text>
            </View>
            <View style={s.bankItem}>
              <Text style={s.bankLabel}>IBAN</Text>
              <Text style={s.bankValue}>AE590860000009339072484</Text>
            </View>
            <View style={s.bankItem}>
              <Text style={s.bankLabel}>BIC / SWIFT</Text>
              <Text style={s.bankValue}>WIOBAEADXXX</Text>
            </View>
            <View style={s.bankItem}>
              <Text style={s.bankLabel}>Business Address</Text>
              <Text style={s.bankValue}>The Curve Building M44, Dubai, UAE</Text>
            </View>
          </View>
          <Text style={s.bankNote}>
            Please reference Order ID ({proposalRef}) when making payment
          </Text>
        </View>

        {/* Signatures */}
        <View style={s.sigsRow}>
          <View style={s.sigBlock}>
            <Text style={s.sigLabel}>For {proposal.agency_name}:</Text>
            {proposal.provider_signature_url ? (
              <Image src={proposal.provider_signature_url} style={s.sigImg} />
            ) : (
              <View style={s.sigLine} />
            )}
            <Text style={s.sigName}>{xmaInfo.name}</Text>
            <Text style={s.sigMeta}>{xmaInfo.title}</Text>
            <Text style={s.sigDate}>
              {proposal.provider_signed_at
                ? `Signed: ${new Date(proposal.provider_signed_at).toLocaleDateString()}`
                : `Date: ${new Date().toLocaleDateString()}`}
            </Text>
            <View style={s.stamp}>
              <Image src="/xma-company-stamp.png" style={{ width: 110, height: 110 }} />
            </View>
          </View>

          <View style={s.sigBlock}>
            <Text style={s.sigLabel}>For {proposal.company_name}:</Text>
            {proposal.client_signature_url ? (
              <Image src={proposal.client_signature_url} style={s.sigImg} />
            ) : (
              <View style={s.sigLine} />
            )}
            {proposal.client_signed_at ? (
              <>
                <Text style={s.sigName}>{proposal.client_full_name}</Text>
                <Text style={s.sigDate}>
                  Signed: {new Date(proposal.client_signed_at).toLocaleDateString()}
                </Text>
              </>
            ) : (
              <>
                <Text style={s.sigMeta}>Name: _______________________</Text>
                <Text style={s.sigMeta}>Position: ___________________</Text>
                <Text style={s.sigMeta}>Date: _______________________</Text>
              </>
            )}
          </View>
        </View>

        {/* Footer */}
        <View style={s.footer}>
          <Text style={s.footerText}>
            {xmaInfo.email} · {xmaInfo.phone} · xma.ae
          </Text>
          <Text style={s.footerText}>Generated {new Date().toLocaleDateString()}</Text>
        </View>
      </Page>
    </Document>
  );
}
