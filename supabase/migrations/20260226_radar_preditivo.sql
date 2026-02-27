-- ============================================
-- Radar Preditivo - TSE Historical Data & Predictions
-- ============================================

-- 1. tse_election_results: Historical election results by zone
CREATE TABLE IF NOT EXISTS tse_election_results (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  election_year INTEGER NOT NULL,
  election_type TEXT NOT NULL DEFAULT 'municipal',
  state TEXT NOT NULL,
  municipality TEXT NOT NULL,
  zone INTEGER NOT NULL,
  candidate_name TEXT NOT NULL,
  candidate_number INTEGER NOT NULL,
  party TEXT NOT NULL,
  coalition TEXT,
  votes INTEGER NOT NULL DEFAULT 0,
  turnout_pct NUMERIC,
  null_votes INTEGER DEFAULT 0,
  blank_votes INTEGER DEFAULT 0,
  total_voters INTEGER,
  fetched_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(election_year, state, municipality, zone, candidate_number)
);

-- 2. tse_campaign_finance: Campaign spending data
CREATE TABLE IF NOT EXISTS tse_campaign_finance (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  election_year INTEGER NOT NULL,
  state TEXT NOT NULL,
  municipality TEXT NOT NULL,
  candidate_name TEXT NOT NULL,
  candidate_number INTEGER NOT NULL,
  party TEXT NOT NULL,
  total_revenue NUMERIC DEFAULT 0,
  total_spending NUMERIC DEFAULT 0,
  spending_category JSONB DEFAULT '{}',
  funding_sources JSONB DEFAULT '[]',
  fetched_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(election_year, state, municipality, candidate_number)
);

-- 3. tse_voter_demographics: Voter profile per zone
CREATE TABLE IF NOT EXISTS tse_voter_demographics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  election_year INTEGER NOT NULL,
  state TEXT NOT NULL,
  municipality TEXT NOT NULL,
  zone INTEGER NOT NULL,
  total_voters INTEGER NOT NULL DEFAULT 0,
  age_distribution JSONB DEFAULT '{}',
  gender_distribution JSONB DEFAULT '{}',
  education_distribution JSONB DEFAULT '{}',
  fetched_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(election_year, state, municipality, zone)
);

-- 4. radar_predictions: Stored AI predictions
CREATE TABLE IF NOT EXISTS radar_predictions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE SET NULL,
  tool TEXT NOT NULL CHECK (tool IN ('thermometer', 'battlemap', 'simulator', 'earlywarning')),
  input_params JSONB NOT NULL DEFAULT '{}',
  result JSONB NOT NULL DEFAULT '{}',
  confidence_level NUMERIC,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. radar_early_warnings: Active early warning signals
CREATE TABLE IF NOT EXISTS radar_early_warnings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE SET NULL,
  pattern_type TEXT NOT NULL,
  probability NUMERIC NOT NULL DEFAULT 0,
  horizon_hours INTEGER NOT NULL DEFAULT 48,
  description TEXT NOT NULL DEFAULT '',
  historical_precedent TEXT,
  is_active BOOLEAN DEFAULT true,
  triggered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- Row Level Security
-- ============================================

ALTER TABLE tse_election_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE tse_campaign_finance ENABLE ROW LEVEL SECURITY;
ALTER TABLE tse_voter_demographics ENABLE ROW LEVEL SECURITY;
ALTER TABLE radar_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE radar_early_warnings ENABLE ROW LEVEL SECURITY;

-- TSE tables: readable by any authenticated user (public data)
CREATE POLICY "Authenticated users can view TSE election results"
  ON tse_election_results FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can view TSE finance"
  ON tse_campaign_finance FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can view TSE demographics"
  ON tse_voter_demographics FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Predictions: users can only access their own
CREATE POLICY "Users can view own predictions"
  ON radar_predictions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own predictions"
  ON radar_predictions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own predictions"
  ON radar_predictions FOR DELETE USING (auth.uid() = user_id);

-- Early warnings: users can only access their own
CREATE POLICY "Users can view own early warnings"
  ON radar_early_warnings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own early warnings"
  ON radar_early_warnings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own early warnings"
  ON radar_early_warnings FOR UPDATE USING (auth.uid() = user_id);

-- ============================================
-- Indexes
-- ============================================

CREATE INDEX idx_tse_results_state_year ON tse_election_results(state, election_year);
CREATE INDEX idx_tse_results_municipality ON tse_election_results(municipality, zone);
CREATE INDEX idx_tse_finance_state_year ON tse_campaign_finance(state, election_year);
CREATE INDEX idx_tse_demographics_state ON tse_voter_demographics(state, municipality, zone);
CREATE INDEX idx_predictions_user ON radar_predictions(user_id);
CREATE INDEX idx_predictions_workspace ON radar_predictions(workspace_id);
CREATE INDEX idx_predictions_tool ON radar_predictions(tool);
CREATE INDEX idx_early_warnings_user ON radar_early_warnings(user_id);
CREATE INDEX idx_early_warnings_active ON radar_early_warnings(is_active);
