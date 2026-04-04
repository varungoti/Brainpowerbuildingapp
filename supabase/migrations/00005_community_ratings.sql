-- Community Activity Ratings: aggregation table
-- Stores pre-computed rating aggregates per activity for fast client reads.
-- The server KV still handles individual user votes; this table provides
-- a Postgres-backed aggregate that can be queried from the client directly.

CREATE TABLE IF NOT EXISTS activity_rating_aggregates (
  activity_id TEXT PRIMARY KEY,
  avg_rating  NUMERIC(3,2) NOT NULL DEFAULT 0,
  vote_count  INTEGER NOT NULL DEFAULT 0,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE activity_rating_aggregates ENABLE ROW LEVEL SECURITY;

-- Anyone can read aggregates (they are anonymous statistics)
CREATE POLICY "Public read on aggregates"
  ON activity_rating_aggregates
  FOR SELECT
  USING (true);

-- Only the service role (edge function) can upsert
CREATE POLICY "Service role upsert aggregates"
  ON activity_rating_aggregates
  FOR ALL
  USING (auth.role() = 'service_role');

CREATE INDEX IF NOT EXISTS idx_ratings_activity ON activity_rating_aggregates (activity_id);
