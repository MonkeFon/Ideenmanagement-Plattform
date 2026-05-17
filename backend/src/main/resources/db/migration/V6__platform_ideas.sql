-- Four platform-self-improvement ideas. They share enough phrasing about
-- "ideas", "clusters", "AI/RAG" and "innovation signals" that they'll form
-- their own visible cluster in the /graph view once embeddings are indexed.
--
-- Mirror lives at scripts/seeds/platform-ideas.json — keep the two in sync.

INSERT INTO ideas (id, tenant_id, author_id, title, description, category, stage, submitted_at) VALUES

('ccccccc3-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'aaaaaaaa-0000-0000-0000-000000000005',
 'Idea DNA — semantic clustering visualization',
 'Show how every idea in the platform relates to, descends from, and bridges between thematic clusters. Built on the existing pgvector embeddings: each idea is a node, edges link semantic neighbours, and connected components surface as colored clusters. Helps leadership see where innovation is concentrating and where the gaps are without reading every submission.',
 'Platform', 'SUBMITTED', now() - interval '2 days'),

('ccccccc3-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'aaaaaaaa-0000-0000-0000-000000000003',
 'AI Devil''s Advocate at the Prioritization gate',
 'Before an idea moves from UNDER_REVIEW into PRIORITIZATION, surface three auto-generated counter-arguments grounded in similar past ideas from the same tenant. RAG over the pgvector index keeps the critiques specific and prevents the LLM from hallucinating drawbacks that don''t apply. Reviewers can dismiss each point or attach it as a formal risk.',
 'Platform', 'UNDER_REVIEW', now() - interval '9 days'),

('ccccccc3-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', 'aaaaaaaa-0000-0000-0000-000000000006',
 'Innovation Pulse — submission heatmap by team',
 'A team × month heatmap of idea submissions surfaced on the admin dashboard. Teams that go three months without a submission are highlighted in amber as a signal — not as a target — so leadership can ask whether the channel is broken, the team is overloaded, or the topic just hasn''t hit them yet.',
 'Platform', 'SUBMITTED', now() - interval '5 days'),

('ccccccc3-0000-0000-0000-000000000004', '11111111-1111-1111-1111-111111111111', 'aaaaaaaa-0000-0000-0000-000000000001',
 'Idea Bounties — reverse the funnel',
 'Today employees post problems they''ve identified. Bounties invert that: leaders post a problem statement with a reward (training budget, conference ticket, an afternoon with the sponsor), and employees submit targeted proposals against it. The standard workflow + scoring still applies; the bounty just narrows the call for solutions.',
 'Platform', 'PRIORITIZATION', now() - interval '17 days');
