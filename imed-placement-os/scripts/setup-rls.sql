-- ============================================================
-- IMED Placement OS — Row Level Security (RLS) Policy Setup
-- Run this script in your Supabase SQL Editor
-- ============================================================

-- 1. Enable RLS on all core tables
ALTER TABLE student_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE alumni_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE gap_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE mentorship_pairs ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE campus_drives ENABLE ROW LEVEL SECURITY;
ALTER TABLE corporate_jobs ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 2. student_profiles: students see only their own row; admins see all
-- ============================================================
CREATE POLICY "Students view own profile"
  ON student_profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Students update own profile"
  ON student_profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Service role full access to student_profiles"
  ON student_profiles FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================================
-- 3. alumni_profiles: alumni see only their own row; admins see all
-- ============================================================
CREATE POLICY "Alumni view own profile"
  ON alumni_profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Alumni update own profile"
  ON alumni_profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Service role full access to alumni_profiles"
  ON alumni_profiles FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================================
-- 4. gap_analyses: students see only their own analyses
-- ============================================================
CREATE POLICY "Students view own gap analyses"
  ON gap_analyses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Students insert own gap analyses"
  ON gap_analyses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role full access to gap_analyses"
  ON gap_analyses FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================================
-- 5. mentorship_pairs: participants can see their own pairs
-- ============================================================
CREATE POLICY "Students see their mentorship pairs"
  ON mentorship_pairs FOR SELECT
  USING (auth.uid() = student_id OR auth.uid() = alumni_id);

CREATE POLICY "Service role full access to mentorship_pairs"
  ON mentorship_pairs FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================================
-- 6. campus_drives & corporate_jobs: readable by all authenticated users
-- ============================================================
CREATE POLICY "Authenticated users can view campus drives"
  ON campus_drives FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view corporate jobs"
  ON corporate_jobs FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Service role full access to campus_drives"
  ON campus_drives FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access to corporate_jobs"
  ON corporate_jobs FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================================
-- 7. job_referrals: authenticated users can view; alumni can insert own
-- ============================================================
CREATE POLICY "Authenticated users can view referrals"
  ON job_referrals FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Alumni insert own referrals"
  ON job_referrals FOR INSERT
  WITH CHECK (auth.uid() = alumni_id);

CREATE POLICY "Service role full access to job_referrals"
  ON job_referrals FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================================
-- 8. donations: authenticated users can view campaigns; alumni insert own
-- ============================================================
CREATE POLICY "Authenticated users can view donations"
  ON donations FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Alumni insert own donations"
  ON donations FOR INSERT
  WITH CHECK (auth.uid() = alumni_id);

CREATE POLICY "Service role full access to donations"
  ON donations FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================================
-- Done! All tables now have RLS enabled with proper policies.
-- The service_role key (used in server-side API routes) bypasses these policies.
-- The anon key (used in client-side) respects them.
-- ============================================================
