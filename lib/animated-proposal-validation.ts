import { iconMap } from "@/lib/icon-map";

interface ValidationPackage {
  price: number;
  currency: string;
  usd_price?: number | null;
  brand?: string | null;
}

interface ValidationTosClause {
  id: number;
  title: string;
  content: string;
  order: number;
}

interface ValidationTos {
  terms: ValidationTosClause[];
  brand?: string | null;
}

interface ValidationPayload {
  package_id?: string | null;
  tos_template_id?: string | null;
  brand: string;
  currency: string;
  total_price_cents: number;
  terms?: Array<unknown>;
  solutions?: Array<{ icon_key?: string | null }>;
  problems?: Array<{ icon_key?: string | null }>;
  total_days?: number | null;
  timeline_nodes?: Array<{ days: number }>;
  retainer_price_cents?: number | null;
  phase_two_teaser?: string | null;
}

const PRICE_TOLERANCE = 0.15;
const KNOWN_ICON_KEYS = new Set(Object.keys(iconMap));

export function validateAnimatedProposal(
  payload: ValidationPayload,
  pkg?: ValidationPackage | null,
  tos?: ValidationTos | null
): { warnings: string[] } {
  const warnings: string[] = [];

  if (pkg && payload.package_id) {
    const floorCents = payload.currency === "USD" && pkg.usd_price
      ? pkg.usd_price * 100
      : pkg.price * 100;

    const deviation = Math.abs(payload.total_price_cents - floorCents) / floorCents;
    if (deviation > PRICE_TOLERANCE) {
      const pct = Math.round(deviation * 100);
      warnings.push(
        `Price deviation ${pct}% from package floor (${pkg.currency} ${pkg.price.toLocaleString()}). Verify with client before sending.`
      );
    }

    if (payload.currency !== pkg.currency && !(payload.currency === "USD" && pkg.usd_price)) {
      warnings.push(
        `Currency mismatch: proposal uses ${payload.currency} but package is priced in ${pkg.currency}.`
      );
    }

    if (pkg.brand && pkg.brand !== payload.brand) {
      warnings.push(
        `Brand mismatch: package is "${pkg.brand}" but proposal brand is "${payload.brand}".`
      );
    }
  }

  if (tos && payload.tos_template_id) {
    const templateClauseCount = tos.terms?.length ?? 0;
    const payloadClauseCount = payload.terms?.length ?? 0;
    if (templateClauseCount > 0 && payloadClauseCount !== templateClauseCount) {
      warnings.push(
        `Terms clause count (${payloadClauseCount}) differs from template (${templateClauseCount}). Ensure all required clauses are present.`
      );
    }

    if (tos.brand && tos.brand !== payload.brand) {
      warnings.push(
        `T&C brand mismatch: template is "${tos.brand}" but proposal brand is "${payload.brand}".`
      );
    }
  }

  const allCards = [...(payload.solutions ?? []), ...(payload.problems ?? [])];
  for (const card of allCards) {
    if (card.icon_key && !KNOWN_ICON_KEYS.has(card.icon_key)) {
      warnings.push(`Unknown icon_key "${card.icon_key}". Will fall back to default icon.`);
    }
  }

  if (!payload.total_days && (payload.timeline_nodes?.length ?? 0) > 0) {
    warnings.push(
      `total_days is not set. Timeline section will display "Project timeline at a glance" instead of a specific duration.`
    );
  }

  if (payload.total_days && payload.timeline_nodes && payload.timeline_nodes.length > 0) {
    const lastDay = payload.timeline_nodes[payload.timeline_nodes.length - 1].days;
    if (lastDay > payload.total_days) {
      warnings.push(
        `Last milestone is Day ${lastDay} but total_days is ${payload.total_days}. Milestone exceeds the stated project duration.`
      );
    }
  }

  if (payload.retainer_price_cents && !payload.phase_two_teaser) {
    warnings.push(
      `Retainer is set but phase_two_teaser is empty. Consider adding a teaser to explain ongoing engagement.`
    );
  }

  return { warnings };
}
