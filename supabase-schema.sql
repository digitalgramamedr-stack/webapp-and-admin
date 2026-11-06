CREATE TABLE IF NOT EXISTS public.service_applications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  user_id UUID,
  user_email TEXT,
  category_id TEXT NOT NULL,
  category_title TEXT NOT NULL,
  service_id TEXT NOT NULL,
  service_title TEXT NOT NULL,
  applicant_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT NOT NULL,
  aadhaar_number TEXT DEFAULT '',
  ration_card_number TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  aadhaar_doc_url TEXT,
  ration_card_doc_url TEXT,
  extra_doc_url TEXT,
  status TEXT DEFAULT 'Pending' NOT NULL,
  admin_remarks TEXT DEFAULT ''
);

CREATE TABLE IF NOT EXISTS public.digiprint_orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  user_id UUID,
  user_email TEXT,
  item_id TEXT NOT NULL,
  item_title TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  delivery_address TEXT NOT NULL,
  quantity INTEGER DEFAULT 1 NOT NULL,
  custom_text TEXT DEFAULT '',
  photo_url TEXT,
  status TEXT DEFAULT 'Pending' NOT NULL
);

ALTER TABLE public.service_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.digiprint_orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all operations on service_applications" ON public.service_applications;
CREATE POLICY "Allow all operations on service_applications"
  ON public.service_applications FOR ALL
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all operations on digiprint_orders" ON public.digiprint_orders;
CREATE POLICY "Allow all operations on digiprint_orders"
  ON public.digiprint_orders FOR ALL
  USING (true)
  WITH CHECK (true);

INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public Access to documents bucket" ON storage.objects;
CREATE POLICY "Public Access to documents bucket"
  ON storage.objects FOR ALL
  USING (bucket_id = 'documents')
  WITH CHECK (bucket_id = 'documents');
