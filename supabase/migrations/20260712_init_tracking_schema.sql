-- init_tracking_schema
-- History table for tracking user link queries

CREATE TABLE public.history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  original_url text NOT NULL,
  resolved_url text NOT NULL,
  file_name text NOT NULL,
  file_size text NOT NULL,
  media_type text NOT NULL CHECK (media_type IN ('video', 'audio', 'document')),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public inserts" ON public.history
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow owner selects" ON public.history
  FOR SELECT
  USING (
    user_id = auth.uid()
    OR user_id IS NULL
  );
