import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { requireAuth } from "@/lib/api-auth";
import { createAnimatedProposalSchema } from "@/lib/animated-proposal-schema";
import { validateAnimatedProposal } from "@/lib/animated-proposal-validation";
import { generateOrderId, getNextSequentialNumber } from "@/lib/orderIdGenerator";
import { getPostHogClient } from "@/lib/posthog-server";

export async function POST(request: Request) {
  const { user, error: authError } = await requireAuth();
  if (authError) return authError;

  const body = await request.json();
  const parsed = createAnimatedProposalSchema.safeParse({ ...body, created_by: user!.id });

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const supabase = await createClient();
  const { package_id, tos_template_id, override_warnings, ...insertData } = parsed.data;

  let pkg = null;
  let tos = null;

  if (package_id) {
    const { data } = await supabase.from("packages").select("price, currency, usd_price, brand").eq("id", package_id).single();
    pkg = data;
  }

  if (tos_template_id) {
    const { data } = await supabase.from("tos_templates").select("terms, brand").eq("id", tos_template_id).single();
    tos = data;
  }

  const { warnings } = validateAnimatedProposal(parsed.data, pkg, tos);

  const seqNum = await getNextSequentialNumber(supabase);
  const order_id = generateOrderId(seqNum);

  const { data, error } = await supabase
    .from("animated_proposals")
    .insert({ ...insertData, package_id: package_id ?? null, tos_template_id: tos_template_id ?? null, created_by: user!.id, status: "sent", order_id })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "Slug already in use" }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const posthog = getPostHogClient();
  posthog.capture({
    distinctId: user!.id,
    event: "animated_proposal_created",
    properties: {
      proposal_id: data.id,
      company_name: data.company_name,
      project_title: data.project_title,
      brand: data.brand,
      currency: data.currency,
      total_price_cents: data.total_price_cents,
    },
  });

  return NextResponse.json({ ...data, warnings }, { status: 201 });
}

export async function GET(request: Request) {
  const { user, error: authError } = await requireAuth();
  if (authError) return authError;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const archivedOnly = searchParams.get("archivedOnly") === "true";
  const includeArchived = searchParams.get("includeArchived") !== "false";
  const createdBy = searchParams.get("createdBy");
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = parseInt(searchParams.get("limit") ?? "100");
  const offset = (page - 1) * limit;

  const supabase = await createClient();

  let query = supabase
    .from("animated_proposals")
    .select("id, token, slug, status, brand, client_full_name, company_name, project_title, total_price_cents, currency, created_at, updated_at, archived_at, expires_at, created_by, client_signed_at, provider_signed_at", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (archivedOnly) {
    query = query.not("archived_at", "is", null);
  } else if (!includeArchived) {
    query = query.is("archived_at", null);
  }

  if (status) query = query.eq("status", status);
  if (createdBy) query = query.eq("created_by", createdBy);

  const { data, error, count } = await query;

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ data, count, page, limit });
}
