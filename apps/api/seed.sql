-- Demo rows for local development. Safe to re-run (INSERT OR IGNORE).
INSERT OR IGNORE INTO todos (id, title, completed, created_at) VALUES
	('seed-1', '발표 슬라이드 준비', 0, '2026-10-01T09:00:00.000Z'),
	('seed-2', '데모 시나리오 리허설', 1, '2026-10-01T09:30:00.000Z');
