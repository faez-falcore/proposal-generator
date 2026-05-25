-- Give sales_reps read + update access to ALL proposals (classic + animated)

-- ── Classic proposals ──────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Sales reps can view own proposals" ON proposals;
CREATE POLICY "Sales reps can view all proposals" ON proposals
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'sales_rep'
    )
  );

DROP POLICY IF EXISTS "Sales reps can update own non-archived proposals" ON proposals;
CREATE POLICY "Sales reps can update all non-archived proposals" ON proposals
  FOR UPDATE USING (
    archived_at IS NULL
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'sales_rep'
    )
  ) WITH CHECK (
    archived_at IS NULL
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'sales_rep'
    )
  );

-- ── proposal_services ──────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Users can view proposal services for accessible proposals" ON proposal_services;
CREATE POLICY "Users can view proposal services for accessible proposals" ON proposal_services
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM proposals p
      WHERE p.id = proposal_services.proposal_id
        AND (
          EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'sales_rep'))
        )
    )
  );

DROP POLICY IF EXISTS "Users can manage proposal services for owned proposals" ON proposal_services;
CREATE POLICY "Users can manage proposal services for accessible proposals" ON proposal_services
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM proposals p
      WHERE p.id = proposal_services.proposal_id
        AND (
          EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'sales_rep'))
        )
    )
  );

-- ── proposal_links ─────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Users can view links for accessible proposals" ON proposal_links;
CREATE POLICY "Users can view links for accessible proposals" ON proposal_links
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM proposals p
      WHERE p.id = proposal_links.proposal_id
        AND (
          EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'sales_rep'))
        )
    )
  );

-- ── Animated proposals ─────────────────────────────────────────────────────

DROP POLICY IF EXISTS ap_select ON animated_proposals;
CREATE POLICY ap_select ON animated_proposals FOR SELECT USING (
  created_by = auth.uid()
  OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'sales_rep'))
);

DROP POLICY IF EXISTS ap_update ON animated_proposals;
CREATE POLICY ap_update ON animated_proposals FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'sales_rep'))
) WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'sales_rep'))
);

-- ── animated_proposal_events ───────────────────────────────────────────────

DROP POLICY IF EXISTS ape_select ON animated_proposal_events;
CREATE POLICY ape_select ON animated_proposal_events FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.animated_proposals p
    WHERE p.id = animated_proposal_events.proposal_id
      AND (
        p.created_by = auth.uid()
        OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'sales_rep'))
      )
  )
);
