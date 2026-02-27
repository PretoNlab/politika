-- Rate limiting table for server-side API protection
CREATE TABLE IF NOT EXISTS api_rate_limits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Fast lookup by user + endpoint + time window
CREATE INDEX idx_rate_limits_lookup ON api_rate_limits(user_id, endpoint, created_at DESC);

-- Auto-cleanup: delete records older than 1 hour (run periodically or via pg_cron)
-- For now, RLS ensures only service_role can access
ALTER TABLE api_rate_limits ENABLE ROW LEVEL SECURITY;

-- Only service_role (used by serverless functions) can read/write
CREATE POLICY "service_role_full_access" ON api_rate_limits
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
