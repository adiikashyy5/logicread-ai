/*
# LogicRead AI — Core Schema

## Overview
Creates the full database schema for LogicRead AI, a reading comprehension
platform for NSW Selective High School test preparation.

## New Tables

### profiles
Stores user profile data linked to Supabase auth.
- id (uuid, PK, references auth.users)
- role: 'student' or 'parent'
- full_name: display name
- linked_student_id: for parents to link to a student account (optional)
- created_at

### quiz_sessions
Records each time a student completes a reading module.
- id (uuid, PK)
- user_id (uuid, FK → auth.users, owner)
- module_id: string identifier matching the frontend sample data
- module_title: display title of the module
- score: number of correct answers
- total: total number of questions
- completed_at: timestamp

### question_attempts
Records individual question-level data per session.
- id (uuid, PK)
- session_id (uuid, FK → quiz_sessions)
- user_id (uuid, FK → auth.users, owner)
- module_id: module identifier
- question_id: question identifier
- question_text: full question text
- selected_option_id: which option the student chose
- highlighted_text: the sentence the student highlighted as evidence
- is_correct: boolean
- error_type: one of 'overgeneralization', 'ignoring_negatives', 'misinterpreting_context' or null
- nli_result: 'entailment', 'neutral', 'contradiction' or null
- similarity_score: float 0–1 from semantic similarity layer
- created_at

### error_records
Aggregated error counts per session for parent dashboard charts.
- id (uuid, PK)
- session_id (uuid, FK → quiz_sessions)
- user_id (uuid, FK → auth.users, owner)
- error_type: one of the three error categories
- count: number of times this error type occurred in the session
- created_at

## Security
- RLS enabled on all 4 tables
- authenticated users can only read/write their own rows (auth.uid() = user_id)
- profiles: users can read and update their own profile; insert on sign-up

## Notes
1. user_id columns default to auth.uid() so frontend inserts omitting user_id still pass RLS.
2. No destructive operations — purely additive schema.
3. Indexes on user_id for all tables for query performance.
*/

-- ============================================================
-- profiles
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('student', 'parent')),
  full_name text NOT NULL,
  linked_student_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_profile" ON profiles;
CREATE POLICY "select_own_profile" ON profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "insert_own_profile" ON profiles;
CREATE POLICY "insert_own_profile" ON profiles
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "update_own_profile" ON profiles;
CREATE POLICY "update_own_profile" ON profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "delete_own_profile" ON profiles;
CREATE POLICY "delete_own_profile" ON profiles
  FOR DELETE TO authenticated
  USING (auth.uid() = id);

-- ============================================================
-- quiz_sessions
-- ============================================================
CREATE TABLE IF NOT EXISTS quiz_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  module_id text NOT NULL,
  module_title text NOT NULL DEFAULT '',
  score integer NOT NULL DEFAULT 0,
  total integer NOT NULL DEFAULT 0,
  completed_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS quiz_sessions_user_id_idx ON quiz_sessions(user_id);

ALTER TABLE quiz_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_sessions" ON quiz_sessions;
CREATE POLICY "select_own_sessions" ON quiz_sessions
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_sessions" ON quiz_sessions;
CREATE POLICY "insert_own_sessions" ON quiz_sessions
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_sessions" ON quiz_sessions;
CREATE POLICY "update_own_sessions" ON quiz_sessions
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_sessions" ON quiz_sessions;
CREATE POLICY "delete_own_sessions" ON quiz_sessions
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================
-- question_attempts
-- ============================================================
CREATE TABLE IF NOT EXISTS question_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES quiz_sessions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  module_id text NOT NULL,
  question_id text NOT NULL,
  question_text text NOT NULL DEFAULT '',
  selected_option_id text,
  highlighted_text text,
  is_correct boolean NOT NULL DEFAULT false,
  error_type text CHECK (error_type IN ('overgeneralization', 'ignoring_negatives', 'misinterpreting_context')),
  nli_result text CHECK (nli_result IN ('entailment', 'neutral', 'contradiction')),
  similarity_score float,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS question_attempts_user_id_idx ON question_attempts(user_id);
CREATE INDEX IF NOT EXISTS question_attempts_session_id_idx ON question_attempts(session_id);

ALTER TABLE question_attempts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_attempts" ON question_attempts;
CREATE POLICY "select_own_attempts" ON question_attempts
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_attempts" ON question_attempts;
CREATE POLICY "insert_own_attempts" ON question_attempts
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_attempts" ON question_attempts;
CREATE POLICY "update_own_attempts" ON question_attempts
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_attempts" ON question_attempts;
CREATE POLICY "delete_own_attempts" ON question_attempts
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================
-- error_records
-- ============================================================
CREATE TABLE IF NOT EXISTS error_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES quiz_sessions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  error_type text NOT NULL CHECK (error_type IN ('overgeneralization', 'ignoring_negatives', 'misinterpreting_context')),
  count integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS error_records_user_id_idx ON error_records(user_id);

ALTER TABLE error_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_errors" ON error_records;
CREATE POLICY "select_own_errors" ON error_records
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_errors" ON error_records;
CREATE POLICY "insert_own_errors" ON error_records
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_errors" ON error_records;
CREATE POLICY "update_own_errors" ON error_records
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_errors" ON error_records;
CREATE POLICY "delete_own_errors" ON error_records
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);
