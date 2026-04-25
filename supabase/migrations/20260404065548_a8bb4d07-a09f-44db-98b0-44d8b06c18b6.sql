
-- Create brands table
CREATE TABLE public.brands (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  api_key TEXT NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  allowed_domains TEXT[] DEFAULT '{}',
  widget_theme JSONB DEFAULT '{"primaryColor": "#000000", "buttonText": "Try On", "position": "bottom-right"}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Unique index on api_key for fast lookups
CREATE UNIQUE INDEX idx_brands_api_key ON public.brands (api_key);

-- Enable RLS
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;

-- Brands can view their own record
CREATE POLICY "Users can view their own brands"
  ON public.brands FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create brands
CREATE POLICY "Users can create brands"
  ON public.brands FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own brands
CREATE POLICY "Users can update their own brands"
  ON public.brands FOR UPDATE
  USING (auth.uid() = user_id);

-- Allow edge functions to read brands by api_key (service role bypasses RLS, but also add anon select for widget validation)
CREATE POLICY "Anyone can validate brand by api_key"
  ON public.brands FOR SELECT
  USING (is_active = true);

-- Create tryon_logs table
CREATE TABLE public.tryon_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  brand_id UUID NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  garment_url TEXT,
  status TEXT NOT NULL DEFAULT 'started',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.tryon_logs ENABLE ROW LEVEL SECURITY;

-- Brands can view their own logs (join through brands table)
CREATE POLICY "Brand owners can view their tryon logs"
  ON public.tryon_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.brands
      WHERE brands.id = tryon_logs.brand_id
      AND brands.user_id = auth.uid()
    )
  );

-- Allow inserts from edge functions (anon key with brand validation done in code)
CREATE POLICY "Allow insert tryon logs"
  ON public.tryon_logs FOR INSERT
  WITH CHECK (true);

-- Timestamp trigger for brands
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_brands_updated_at
  BEFORE UPDATE ON public.brands
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
