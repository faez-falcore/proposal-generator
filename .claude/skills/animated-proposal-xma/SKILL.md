# Animated Proposal — XMA / XMA Media

Create a highly personalized animated proposal website for an XMA or XMA Media prospect. Proposals live at `https://xma-proposal-generator.vercel.app/proposal/<token>` immediately after creation.

## Prerequisites

Connect via the Claude.ai connector (OAuth) or add manually:

```bash
claude mcp add --transport http xma-proposals https://xma-proposal-generator.vercel.app/api/mcp
```

Get your API key from `/admin/mcp-keys` in the admin dashboard.

## Quick Start

1. Tell Claude you want to create a proposal and whether you have a call transcript.
2. Claude interviews you section-by-section before calling any tools.
3. Review the drafted JSON payload — correct anything off.
4. Claude submits. You get a live URL (admin must approve before sharing).

## Full Workflow

### Step 0: Transcript Triage

Before calling any MCP tools, check for a transcript:

- **Transcript provided** → pre-fill answers from transcript, then walk groups A–G section-by-section asking the rep to confirm or correct each pre-filled answer before moving to the next group.
- **No transcript** → run the full interview below, group A through G, waiting for answers after each group.

**Do not call any MCP tool until the entire A–G interview is complete.**

---

### Interview Group A — Identity & Brand

Ask these, wait for answers, then move to Group B.

```
Group A — Identity & Brand

1. Client first name and last name — correct spelling?
2. Company name — legal name or trading name (or both)?
3. Client's role / title?
4. Brand for this proposal — XMA or XMA Media? (default: XMA Media)
5. Your name as it should appear on the proposal (provider name)?
6. Project title — 4–8 words, descriptive (e.g. "Digital Growth Engine for Bloomforge")?

Answer these, then I'll move to Group B.
```

---

### Interview Group B — Problems (drill until specific)

```
Group B — Problems

7. What are the top 3 pain points this client mentioned? For each one:
   a. Which exact tool, process, or team is broken or underperforming?
   b. Any dollar, hour, or percentage cost they quoted for this pain? (If none mentioned, we'll leave numbers out.)
8. What have they already tried that didn't work?
9. Why now? What deadline, event, or trigger is forcing this decision?

Answer these, then I'll move to Group C.
```

---

### Interview Group C — Solutions & Scope

```
Group C — Solutions & Scope

10. Top 3 outcomes the client wants (mirror each of the 3 pains above)?
11. Phase 1 deliverables — list every asset, integration, automation, or page in scope.
    Aim for 8–16 specific items (e.g. "CRM integration with HubSpot", "5-page website redesign").
12. Anything explicitly out of scope they mentioned?
13. What tools or platforms do they already use that we should know about (to avoid duplication)?

Answer these, then I'll move to Group D.
```

---

### Interview Group D — Timeline

All days are **business days** (Monday–Friday, no holidays).
`timeline_nodes[].days` = **cumulative business day from onboarding kickoff** (Day 1 = kickoff call / onboarding session). Each milestone must have a strictly higher day number than the previous.

```
Group D — Timeline

14. Kickoff date — do they have a target start, or "as soon as paid"?
15. Total project length in business days?
16. Walk me through the milestones in order. For each milestone:
    a. Name / label (e.g. "Discovery complete", "Phase 1 launch")
    b. What gets delivered at this milestone?
    c. Which business day from kickoff? (Day 1 = kickoff, Day 7, Day 14, Day 21, etc.)
17. Any hard launch dates or external deadlines we're anchoring to?

Answer these, then I'll move to Group E.
```

---

### Interview Group E — Commercials

```
Group E — Commercials

18. Total investment — exact amount + currency (AED or USD)?
19. Payment split — single upfront milestone? 50/50? Something else?
    If split: how much is the upfront milestone (in same currency)?
20. Monthly retainer — yes or no?
    If yes: amount + what ongoing services are included (bullet points)?
21. Payment link — Stripe, PayTabs, or other URL? (Optional — can add later.)

Answer these, then I'll move to Group F.
```

---

### Interview Group F — Guarantee & Legal

```
Group F — Guarantee & Legal

22. Did you promise any specific metric or outcome guarantee (e.g. "10 qualified leads/month")?
    If yes, quote the exact wording — we'll use it verbatim or pull from the snippet library.
23. Which T&C template to use — XMA or XMA Media? Retainer or one-time?
    (I'll load the right template from the library.)
24. Clause 03 — Client Obligations: what specific assets or access is the client providing?
    List each item (e.g. "Admin access to HubSpot", "Brand guidelines PDF", "Weekly 30-min check-in", "24-hour approval SLA").

Answer these, then I'll move to Group G.
```

---

### Interview Group G — Final Details

```
Group G — Final details

25. Proposal expiry date? (e.g. "14 days from today", or a specific date)
26. Slug preference? Auto-generate uses: {first-name}-{company-slug}-{mon}{year}
    e.g. "sarah-bloomforge-apr2026" — confirm or give a custom slug.

Once you answer these, I'll show you the full draft for review before submitting.
```

---

### Step 1: Ground in catalog

After A–G is complete, call MCP tools to load structured context:

```
list_packages({ brand })          → find candidate package by price/features
get_package({ id })               → read features array for scope/solution grounding
list_tos_templates({ brand })     → list available T&C templates
get_tos_template({ id })          → load full clauses → use mapped_clauses as terms[]
list_snippets({ category })       → load problem/solution/guarantee copy bank
```

Pick the closest standard package. If nothing fits → `package_id: null` (custom).
Pick the T&C template matching brand + payment type. Load its `mapped_clauses` directly as the `terms[]` array — then customize Clause 03 (Client Obligations) with the specific assets/access from Group F Q24.

---

### Step 2: Draft the variables

Every piece of content must come from the interview, transcript, snippets, or package features — zero invention.

| Variable | Source |
|---|---|
| `client_first_name` | Group A Q1 |
| `client_full_name` | Group A Q1 |
| `company_name` | Group A Q2 |
| `project_title` | Group A Q6 |
| `provider_name` | Group A Q5 |
| `agency_name` | "XMA Media" or "XMA Agency" |
| `intro_paragraph` | 2–3 sentences referencing specific call details |
| `challenge_intro` | 1 sentence, lead with dollar or opportunity impact |
| `problems[3]` | Group B Q7 — 3 pains, {title, desc, icon_key} — draw from snippets |
| `solution_intro` | 1 sentence connecting solution to their specific problem |
| `solutions[3]` | Group C Q10 — 3 solutions mirroring problems, {title, desc, icon_key} — draw from snippets |
| `scope_phase_name` | "Phase 1: Foundation" or similar |
| `scope_subtitle` | One-line phase description |
| `scope_items[]` | Group C Q11 — 8–16 deliverables |
| `timeline_nodes[]` | Group D Q16 — cumulative business days from kickoff, Day 1 = kickoff, strictly increasing |
| `total_days` | Group D Q15 — total project length in business days |
| `retainer_bullets[]` | Group E Q20 — ongoing services if retainer agreed |
| `total_price_cents` | Group E Q18 — investment in cents (AED 15,000 = 1500000) |
| `milestone_cents` | Group E Q19 — upfront milestone in cents |
| `retainer_price_cents` | Group E Q20 — monthly retainer in cents (if applicable) |
| `guarantee_text` | Group F Q22 — verbatim or from snippets |
| `terms[]` | Group F Q23 — `get_tos_template().mapped_clauses`, customize clause 03 with Group F Q24 |
| `stripe_link` | Group E Q21 — payment URL (omit if not provided) |
| `package_id` | UUID from `list_packages`, or null |
| `tos_template_id` | UUID from `list_tos_templates` |
| `expires_at` | Group G Q25 — ISO datetime |
| `slug` | Group G Q26 |

**Timeline contract:**
- `timeline_nodes[0].days` MUST equal `1` (onboarding/kickoff session)
- Each subsequent node's `days` must be strictly greater than the previous
- All days are business days (Monday–Friday)
- Last node's `days` should be ≤ `total_days`

**Icon keys** (pick best match):
`time_loss`, `money_bleed`, `inefficiency`, `manual_ops`, `low_conversion`, `lead_leakage`, `growth`, `automation`, `speed`, `personalization`, `revenue`, `visibility`, `strategy`, `integration`, `analytics`

**Slug format:** `{first-name-lowercase}-{company-slug}-{mon}{year}` → e.g., `sarah-bloomforge-apr2026`

---

### Step 3: Show draft to rep

Present the full payload as JSON. Ask rep to confirm:
- Price, currency, total_days
- Client name spelling
- Timeline milestone sequence (Day 1, Day X, Day Y … — do days look right?)
- Scope items completeness
- Clause 03 obligations are complete

---

### Step 4: Submit

```
create_animated_proposal({ payload })
```

Returns:
- `draft_url` — public URL (inactive until admin approves)
- `admin_url` — for admin approval
- `warnings[]` — soft issues to review

If warnings appear, review with rep. Re-call with `override_warnings: true` if rep confirms to proceed.

---

### Step 5: Notify rep

- Admin must approve before sharing the link
- Admin URL: shown in tool output
- Public link: shown in tool output (share once approved)

---

## Content Fidelity Rule

**Zero invention.** Every dollar figure, pain point, scope item, metric, and guarantee must come from what the prospect said (in call or transcript) or from the approved snippet library. If something wasn't discussed, leave it out or ask the rep.

## Common Mistakes

- Don't invent dollar figures or metrics — use only what was mentioned.
- Don't generalize problems — name the specific process, tool, or team the prospect mentioned.
- `problems` and `solutions` must each be exactly 3 items.
- `timeline_nodes[0].days` must be `1`. Days must strictly increase. These are business days.
- `slug` must match `^[a-z0-9-]+$`.
- `total_price_cents` must be integer (no decimal).
- If using a T&C template, use `mapped_clauses` from `get_tos_template` as-is and customize only Clause 03.
