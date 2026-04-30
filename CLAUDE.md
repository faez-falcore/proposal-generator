# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
bun dev          # start dev server (localhost:3000)
bun lint         # ESLint (next/core-web-vitals + typescript)
bun seed:admin   # seed initial admin user (scripts/seed-admin.js)
```

**Never run `bun build`** unless explicitly asked. No automated tests exist — manual testing only.

## Tech Stack

Next.js 15 App Router · Supabase (Postgres + Auth + RLS) · TypeScript strict · Tailwind CSS v4 · TanStack Query · Radix UI · Zod · GSAP · `@modelcontextprotocol/sdk` 1.29

## Route Structure

```
app/
  (admin)/          # authenticated shell — proposals, generator, admin, reports, invoices
  proposal/[token]/ # public animated proposal viewer (token-gated)
  api/
    mcp/            # MCP HTTP server + OAuth 2.0 (PKCE) for Claude Desktop
    animated-proposals/
    proposals/
    invoices/
    mcp-keys/
  .well-known/oauth-authorization-server/  # OAuth discovery metadata
```

## Two Proposal Systems (never mix them)

### Classic proposals (`proposals` table)
- Built in `app/(admin)/proposal-generator/`
- JSONB snapshot in `proposal_data` + relational fields
- Shared via `encoded_data` (URL-safe base64)
- Discount system: package / service / overall — each can be `%` or fixed

### Animated proposals (`animated_proposals` table)
- Authored by sales reps via Claude Desktop using the `xma-proposals` MCP server
- Schema + Zod validation: `lib/animated-proposal-schema.ts`
- `timeline_nodes[].days` = **cumulative business days from kickoff** — first node MUST be `days: 1`, strictly increasing
- Status flow: `draft → pending_approval → approved → sent → client_signed → counter_signed → paid | archived`
- Public viewer: `app/proposal/[token]/` — token-gated via Supabase RPC `get_animated_by_token`
- Admin approval + counter-sign: `app/(admin)/proposals/animated/[id]/`
- Soft-validation warnings (non-blocking) in `lib/animated-proposal-validation.ts`
- Signatures stored in Supabase Storage: `signatures/<proposal_id>/{client,provider}.png`

## MCP Server (`app/api/mcp/`)

- Transport: `WebStandardStreamableHTTPServerTransport` (stateless — new instance per request)
- Auth: OAuth 2.0 with PKCE. `.mcp.json` points to `http://localhost:3000/api/mcp` with no hardcoded token — Claude Desktop discovers OAuth via `/.well-known/oauth-authorization-server` and handles the browser login flow
- OAuth tables: `mcp_oauth_clients`, `mcp_oauth_codes`, `mcp_oauth_tokens`
- Tools registered in `app/api/mcp/_tools/`: `list_packages`, `get_package`, `list_tos_templates`, `get_tos_template`, `list_snippets`, `create_animated_proposal`, `get_animated_proposal`, `update_animated_proposal`
- Authoring skill for Claude Desktop: `.claude/skills/animated-proposal-xma/SKILL.md`

## Authentication

- **Server components / API routes**: `createClient()` from `utils/supabase/server` + `requireAuth()` / `requireAdmin()` from `lib/api-auth.ts`
- **Client components**: `createBrowserClient()` from `utils/supabase/client`
- **Never** use the service role client in client components
- Roles: `admin` (full access) · `sales_rep` (own proposals only) · `deactivated` (blocked)
- Middleware (`middleware.ts`) refreshes session cookies on every request

## Brand System

Two brands: `xma` and `xma_media`. Stored on `packages.brand` and as a field inside `animated_proposals`.

- XMA Media theme: CSS class `.theme-brand` in `globals.css` — cream bg, purple accent, Manrope + DM Sans fonts
- All animated proposal sub-components accept `isXmaMedia?: boolean` and map to conditional class sets
- Historical proposals always render with their original brand snapshot (no backfill)

## Database Conventions

- **Soft deletes**: `archived_at` timestamp — never hard-delete
- **Order IDs**: `XMA-YYYY-MM-00001` format, generated in `lib/orderIdGenerator.ts`
- **Migrations**: `supabase/migrations/` — run via Supabase CLI against remote project
- `offerings` and `orders` tables exist in DB but have no UI (code was removed; don't recreate)

## Styling

- Tailwind CSS v4 with `@theme` design tokens in `globals.css` — use tokens, not hardcoded values
- Colors: oklch only — never hex or rgb
- `class-variance-authority` (CVA) for variant components
- No ambient glow decorations
- No `overflow: hidden` on sticky-positioned elements
