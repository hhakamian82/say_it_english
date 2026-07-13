-- Instagram DM Drafter MVP (HITL) — log of AI-generated reply drafts
-- Run this migration on the Supabase database (or deploy and visit /api/migrate-db).
-- All statements are guarded: safe to run whether or not the table already exists.

CREATE TABLE IF NOT EXISTS ig_drafts (
    id SERIAL PRIMARY KEY,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    inbound TEXT NOT NULL,
    context TEXT,
    student_handle TEXT,
    draft TEXT NOT NULL,
    edited TEXT,
    sent_status TEXT DEFAULT 'drafted' NOT NULL,
    category TEXT
);
