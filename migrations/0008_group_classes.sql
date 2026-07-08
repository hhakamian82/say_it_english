-- Phase 5: Group Classes (real enrollment flow)
-- Run this migration on the Supabase database (or deploy and visit /api/migrate-db)
-- All statements are guarded: safe to run whether or not the tables already exist.

-- 1. Classes Table
CREATE TABLE IF NOT EXISTS classes (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    level TEXT NOT NULL,
    capacity INTEGER NOT NULL,
    price INTEGER NOT NULL,
    schedule TEXT NOT NULL,
    meet_link TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 2. Enrollments Table
CREATE TABLE IF NOT EXISTS enrollments (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    class_id INTEGER NOT NULL,
    status TEXT DEFAULT 'enrolled',
    created_at TIMESTAMP DEFAULT NOW()
);

-- 3. If classes existed before this migration, make sure meet_link is present
ALTER TABLE classes ADD COLUMN IF NOT EXISTS meet_link TEXT;

-- 4. Link payments to classes (mirrors content_id for one-off content purchases)
ALTER TABLE payments ADD COLUMN IF NOT EXISTS class_id INTEGER;
-- Repeated from 0007 (idempotent) in case 0007 was never applied:
ALTER TABLE payments ALTER COLUMN content_id DROP NOT NULL;

-- 5. Duplicate-enrollment guard + lookup index
-- NOTE: if a pre-existing enrollments table holds duplicate (user_id, class_id) rows,
-- clean them first: SELECT user_id, class_id, COUNT(*) FROM enrollments GROUP BY 1,2 HAVING COUNT(*) > 1;
CREATE UNIQUE INDEX IF NOT EXISTS uniq_enrollments_user_class ON enrollments(user_id, class_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_class ON enrollments(class_id);
