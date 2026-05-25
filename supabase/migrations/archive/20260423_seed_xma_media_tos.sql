-- Insert XMA Media Terms & Conditions template
INSERT INTO tos_templates (name, description, payment_type, terms, created_by)
VALUES (
  'XMA Media — Monthly Retainer',
  'Terms for XMA Media content production and paid advertising management services on a monthly recurring basis',
  'custom',
  '[
    {"id": 1, "title": "Scope of Services", "content": "XMA Media provides content production and paid advertising management services, including:\n- Creation of up to 10 ad-ready video creatives (30–60 seconds) per month\n- Management of one (1) advertising account\n- Campaign setup, testing, and ongoing optimization\n- Weekly performance reporting\n- Bi-weekly strategy calls\n\nAll services are delivered on a monthly recurring basis.", "order": 1},
    {"id": 2, "title": "Payment Terms", "content": "Fees are billed monthly in advance. Work will commence upon receipt of the first payment. Payments are non-refundable, except where explicitly stated in Clause 12 (Guarantee). Late payments may result in pause or termination of services.", "order": 2},
    {"id": 3, "title": "Onboarding & Timeline", "content": "Initial onboarding and strategy setup will be completed within 7–14 days of project start. Ongoing services (content creation, ad management, optimization) operate on a rolling monthly cycle.", "order": 3},
    {"id": 4, "title": "Deliverables & Usage", "content": "Deliverables are capped at 10 video creatives per month unless otherwise agreed. Unused deliverables do not roll over to future months. XMA Media retains discretion over creative direction based on performance data and strategy.", "order": 4},
    {"id": 5, "title": "Client Responsibilities", "content": "The client agrees to:\n- Provide all necessary assets (branding, footage, product details, access to accounts)\n- Provide timely feedback and approvals\n- Maintain an active minimum ad spend of $5,000/month (or agreed amount)\n\nDelays in providing assets or feedback may impact timelines and performance.", "order": 5},
    {"id": 6, "title": "Advertising Spend", "content": "The client is solely responsible for funding all advertising spend directly on platforms (e.g., Meta, Google, TikTok). XMA Media does not front, finance, or manage ad spend funds directly.", "order": 6},
    {"id": 7, "title": "Performance Disclaimer", "content": "XMA Media does not guarantee specific results, including but not limited to revenue, leads, conversions, or ROAS. Performance depends on multiple external factors, including market conditions, offer quality, competition, and budget.", "order": 7},
    {"id": 8, "title": "Communication & Reporting", "content": "Weekly performance reports will be provided. Bi-weekly strategy calls are included. Communication is handled via agreed channels (e.g., WhatsApp, email, Slack).", "order": 8},
    {"id": 9, "title": "Intellectual Property", "content": "Upon full payment, the client receives full usage rights to all delivered creatives. XMA Media retains the right to use creatives for portfolio, case studies, and marketing purposes, unless otherwise agreed in writing.", "order": 9},
    {"id": 10, "title": "Term & Termination", "content": "Services operate on a monthly recurring basis. Either party may terminate with 30 days written notice. No refunds are issued for partially used billing periods.", "order": 10},
    {"id": 11, "title": "Limitation of Liability", "content": "XMA Media''s liability is limited to the total fees paid by the client. XMA Media is not liable for indirect, incidental, or consequential damages, including lost revenue or profits.", "order": 11},
    {"id": 12, "title": "14-Day Performance Guarantee", "content": "If the client is not satisfied within 14 days of campaign launch, they may request a refund. To qualify:\n- The client must have provided all required assets and approvals on time\n- Campaigns must have been actively running with agreed ad spend\n- A written request with specific reasons must be submitted\n\nThe guarantee does not apply in cases of client delay, insufficient ad spend, or external performance factors.", "order": 12},
    {"id": 13, "title": "Confidentiality", "content": "Both parties agree to maintain confidentiality of all proprietary information, data, and business operations shared during the engagement.", "order": 13},
    {"id": 14, "title": "Force Majeure", "content": "XMA Media is not liable for delays or failure to perform due to events beyond its reasonable control (e.g., platform outages, policy changes, natural events).", "order": 14},
    {"id": 15, "title": "Governing Law", "content": "This agreement is governed by the laws of the United Arab Emirates.", "order": 15},
    {"id": 16, "title": "Acceptance", "content": "Payment of the invoice constitutes full acceptance of these Terms & Conditions.", "order": 16}
  ]'::JSONB,
  (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1)
);
