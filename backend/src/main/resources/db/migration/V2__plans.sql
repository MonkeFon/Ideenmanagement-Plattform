INSERT INTO plans (code, display_name, seat_limit, idea_limit, features, price_eur) VALUES
    ('FREE',       'Free',       10,   30,   '[]'::jsonb,                                  0),
    ('PRO',        'Pro',        100,  NULL, '["rag_refine","sso"]'::jsonb,                9),
    ('ENTERPRISE', 'Enterprise', NULL, NULL, '["rag_refine","sso","custom_wf"]'::jsonb,    0);
