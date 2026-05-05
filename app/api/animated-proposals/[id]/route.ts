import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { requireAuth } from "@/lib/api-auth";
import { updateAnimatedProposalSchema, ANIMATED_STATUS_TRANSITIONS, type AnimatedStatus } from "@/lib/animated-proposal-schema";
import { getPostHogClient } from "@/lib/posthog-server";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error: authError } = await requireAuth();
  if (authError) return authError;

  const { id } = await params;
  const body = await request.json();
  const parsed = updateAnimatedProposalSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const supabase = await createClient();

  if (parsed.data.status) {
    const { data: current } = await supabase
      .from("animated_proposals")
      .select("status")
      .eq("id", id)
      .single();

    if (current) {
      const allowed = ANIMATED_STATUS_TRANSITIONS[current.status as AnimatedStatus] ?? [];
      if (!allowed.includes(parsed.data.status as AnimatedStatus)) {
        return NextResponse.json(
          { error: `Cannot transition from '${current.status}' to '${parsed.data.status}'` },
          { status: 400 }
        );
      }
    }
  }

  const { override_warnings: _ow, ...updateFields } = parsed.data;
  const { data, error } = await supabase
    .from("animated_proposals")
    .update(updateFields)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (parsed.data.status) {
    const posthog = getPostHogClient();
    posthog.capture({
      distinctId: user!.id,
      event: "animated_proposal_status_updated",
      properties: {
        proposal_id: id,
        new_status: parsed.data.status,
      },
    });
  }

  return NextResponse.json(data);
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error: authError } = await requireAuth();
  if (authError) return authError;

  const { id } = await params;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("animated_proposals")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(data);
}
