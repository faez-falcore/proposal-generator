export type AnimatedProposalStatus =
  | "sent"
  | "client_signed"
  | "counter_signed"
  | "paid"
  | "archived";

export type AnimatedProposalBrand = "xma" | "xma_media";

export interface ProposalCard {
  title: string;
  desc: string;
  icon_key?: string;
  icon_svg?: string;
}

export interface ScopeItem {
  title: string;
  desc: string;
  icon_key?: string;
  icon_svg?: string;
}

export interface TimelineNode {
  label: string;
  days: number;
  desc: string;
}

export interface TermsClause {
  clause_no: string;
  title: string;
  body: string;
}

export interface AnimatedProposal {
  id: string;
  token: string;
  slug: string;
  status: AnimatedProposalStatus;
  brand: AnimatedProposalBrand;
  created_by: string;
  approved_by: string | null;
  approved_at: string | null;

  client_first_name: string;
  client_full_name: string;
  company_name: string;
  project_title: string;
  provider_name: string;
  agency_name: string;
  proposal_date: string;

  intro_paragraph: string;
  challenge_intro: string;
  problems: ProposalCard[];
  solution_intro: string;
  solutions: ProposalCard[];

  scope_phase_name: string | null;
  scope_subtitle: string | null;
  scope_items: ScopeItem[];

  timeline_nodes: TimelineNode[];
  retainer_bullets: string[];

  total_price_cents: number;
  milestone_cents: number | null;
  retainer_price_cents: number | null;
  currency: string;
  total_days: number | null;

  guarantee_text: string | null;
  phase_two_teaser: string | null;
  terms: TermsClause[];

  stripe_link: string | null;
  stripe_payment_intent_id: string | null;

  client_signature_url: string | null;
  client_signed_at: string | null;
  provider_signature_url: string | null;
  provider_signed_at: string | null;
  signed_pdf_url: string | null;

  order_id: string | null;
  package_id: string | null;
  tos_template_id: string | null;
  expires_at: string | null;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AnimatedProposalEvent {
  id: number;
  proposal_id: string;
  event_type: "view" | "scroll_complete" | "sign_start" | "sign_submit" | "stripe_click";
  meta: Record<string, unknown> | null;
  ip: string | null;
  ua: string | null;
  created_at: string;
}

export type CreateAnimatedProposalInput = Omit<
  AnimatedProposal,
  | "id"
  | "token"
  | "status"
  | "approved_by"
  | "approved_at"
  | "client_signature_url"
  | "client_signed_at"
  | "provider_signature_url"
  | "provider_signed_at"
  | "signed_pdf_url"
  | "stripe_payment_intent_id"
  | "archived_at"
  | "created_at"
  | "updated_at"
>;

export type UpdateAnimatedProposalInput = Partial<
  Omit<
    AnimatedProposal,
    | "id"
    | "token"
    | "created_by"
    | "approved_by"
    | "approved_at"
    | "created_at"
    | "updated_at"
  >
>;
