INSERT INTO storage.buckets (id, name, public) VALUES ('widget', 'widget', true) ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Allow public read access on widget bucket"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'widget');
