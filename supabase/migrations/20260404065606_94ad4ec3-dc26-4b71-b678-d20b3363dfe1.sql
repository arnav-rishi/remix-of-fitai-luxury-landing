
DROP POLICY "Allow insert tryon logs" ON public.tryon_logs;

CREATE POLICY "Allow insert tryon logs for active brands"
  ON public.tryon_logs FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.brands
      WHERE brands.id = tryon_logs.brand_id
      AND brands.is_active = true
    )
  );
