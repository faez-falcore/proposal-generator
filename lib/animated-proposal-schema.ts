import { z } from "zod";

const proposalCardSchema = z.object({
  title: z.string().min(1),
  desc: z.string().min(1),
  icon_key: z.string().optional(),
  icon_svg: z.string().optional(),
});

const scopeItemSchema = z.object({
  title: z.string().min(1),
  desc: z.string().min(1),
  icon_key: z.string().optional(),
  icon_svg: z.string().optional(),
});

const timelineNodeSchema = z.object({
  label: z.string().min(1),
  days: z.number().int().min(1),
  desc: z.string().min(1),
});

const termsClauseSchema = z.object({
  clause_no: z.string().min(1),
  title: z.string().min(1),
  body: z.string().min(1),
});

export const createAnimatedProposalSchema = z.object({
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/, "slug must be lowercase alphanumeric with hyphens"),
  brand: z.enum(["xma", "xma_media"]).default("xma_media"),
  created_by: z.string().uuid(),

  client_first_name: z.string().min(1),
  client_full_name: z.string().min(1),
  company_name: z.string().min(1),
  project_title: z.string().min(1),
  provider_name: z.string().min(1),
  agency_name: z.string().default("XMA Media"),
  proposal_date: z.string().optional(),

  intro_paragraph: z.string().min(1),
  challenge_intro: z.string().min(1),
  problems: z.array(proposalCardSchema).length(3),
  solution_intro: z.string().min(1),
  solutions: z.array(proposalCardSchema).length(3),

  scope_phase_name: z.string().optional().nullable(),
  scope_subtitle: z.string().optional().nullable(),
  scope_items: z.array(scopeItemSchema).min(1),

  timeline_nodes: z.array(timelineNodeSchema)
    .min(2)
    .refine(
      (nodes) => nodes[0].days === 1,
      { message: "First milestone must be Day 1 (onboarding kickoff)" }
    )
    .refine(
      (nodes) => nodes.every((n, i) => i === 0 || n.days > nodes[i - 1].days),
      { message: "Milestone days must strictly increase" }
    ),
  retainer_bullets: z.array(z.string()).default([]),

  total_price_cents: z.number().int().positive(),
  milestone_cents: z.number().int().positive().optional().nullable(),
  retainer_price_cents: z.number().int().positive().optional().nullable(),
  currency: z.string().length(3).default("AED"),
  total_days: z.number().int().positive().optional().nullable(),

  guarantee_text: z.string().optional().nullable(),
  phase_two_teaser: z.string().optional().nullable(),
  terms: z.array(termsClauseSchema).default([]),

  stripe_link: z.string().url().optional().nullable(),
  expires_at: z.string().datetime().optional().nullable(),

  package_id: z.string().uuid().optional().nullable(),
  tos_template_id: z.string().uuid().optional().nullable(),
  override_warnings: z.boolean().default(false),
});

export const ANIMATED_STATUS = z.enum(["sent", "client_signed", "counter_signed", "paid", "archived"]);
export type AnimatedStatus = z.infer<typeof ANIMATED_STATUS>;

export const ANIMATED_STATUS_TRANSITIONS: Record<AnimatedStatus, AnimatedStatus[]> = {
  sent: ["client_signed", "counter_signed", "paid", "archived"],
  client_signed: ["counter_signed", "paid", "archived"],
  counter_signed: ["paid", "archived"],
  paid: ["archived"],
  archived: [],
};

export const updateAnimatedProposalSchema = createAnimatedProposalSchema
  .omit({ slug: true, created_by: true })
  .partial()
  .extend({
    status: ANIMATED_STATUS.optional(),
  });

export const signClientSchema = z.object({
  signature_png_base64: z.string().min(100),
});

export const signProviderSchema = z.object({
  signature_png_base64: z.string().min(100),
});

export const eventSchema = z.object({
  event_type: z.enum(["view", "scroll_complete", "sign_start", "sign_submit", "stripe_click"]),
  meta: z.record(z.string(), z.unknown()).optional(),
});

export type CreateAnimatedProposalInput = z.infer<typeof createAnimatedProposalSchema>;
export type UpdateAnimatedProposalInput = z.infer<typeof updateAnimatedProposalSchema>;
