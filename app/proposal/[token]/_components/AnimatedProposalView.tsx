"use client";

import { useState } from "react";
import type { AnimatedProposal } from "@/types/animated-proposal";
import { WelcomeOverlay } from "./WelcomeOverlay";
import { AnimatedPrintButton } from "@/components/animated-proposal/AnimatedPrintButton";
import { Hero } from "./Hero";
import { PersonalProblem } from "./PersonalProblem";
import { ChallengeSection } from "./ChallengeSection";
import { SolutionSection } from "./SolutionSection";
import { ScopeSection } from "./ScopeSection";
import { TimelineSection } from "./TimelineSection";
import { InvestmentSection } from "./InvestmentSection";
import { GuaranteeSection } from "./GuaranteeSection";
import { TermsSection } from "./TermsSection";
import { SignatureSection } from "./SignatureSection";
import { useAnalyticsPing } from "./useAnalyticsPing";

interface Props {
  proposal: AnimatedProposal;
}

export function AnimatedProposalView({ proposal }: Props) {
  const isXmaMedia = proposal.brand === "xma_media";
  const [introComplete, setIntroComplete] = useState(false);
  useAnalyticsPing(proposal.id);

  return (
    <div className={`theme-animated${isXmaMedia ? " brand-xma-media" : ""}`}>
      {!introComplete && (
        <WelcomeOverlay
          clientFirstName={proposal.client_first_name}
          companyName={proposal.company_name}
          onDismissed={() => setIntroComplete(true)}
        />
      )}

      {introComplete && (
        <div className="fixed top-4 right-4 z-50">
          <AnimatedPrintButton
            proposal={proposal}
            variant="outline"
            size="sm"
            className="bg-white/90 text-zinc-900 border-white/30 hover:bg-white backdrop-blur-sm shadow-md"
          />
        </div>
      )}

      <div className="min-h-screen" style={{ fontFamily: "var(--font-body)" }}>
        <Hero proposal={proposal} introComplete={introComplete} />
        <PersonalProblem
          clientFirstName={proposal.client_first_name}
          body={proposal.challenge_intro}
        />
        <ChallengeSection problems={proposal.problems} />
        <SolutionSection
          intro={proposal.solution_intro}
          solutions={proposal.solutions}
        />
        <ScopeSection
          phaseName={proposal.scope_phase_name}
          subtitle={proposal.scope_subtitle}
          items={proposal.scope_items}
        />
        <TimelineSection
          nodes={proposal.timeline_nodes}
          totalDays={proposal.total_days}
        />
        <InvestmentSection
          totalPriceCents={proposal.total_price_cents}
          milestoneCents={proposal.milestone_cents}
          retainerPriceCents={proposal.retainer_price_cents}
          retainerBullets={proposal.retainer_bullets}
          currency={proposal.currency}
        />
        {proposal.guarantee_text && (
          <GuaranteeSection
            guaranteeText={proposal.guarantee_text}
            phaseTwoTeaser={proposal.phase_two_teaser}
          />
        )}
        {proposal.terms.length > 0 && (
          <TermsSection terms={proposal.terms} />
        )}
        <SignatureSection
          proposalId={proposal.id}
          clientSignedAt={proposal.client_signed_at}
          stripeLink={proposal.stripe_link}
          status={proposal.status}
          brand={proposal.brand}
        />
      </div>
    </div>
  );
}
