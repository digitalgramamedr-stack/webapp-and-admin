import { createClient } from './client';
import type { OrderLifecycleStatus } from '@/components/OrderStatusTracker';

export interface ServiceApplicationRecord {
  id: string;
  created_at: string;
  user_id: string | null;
  user_email: string | null;
  category_id: string;
  category_title: string;
  service_id: string;
  service_title: string;
  applicant_name: string;
  phone: string;
  address: string;
  aadhaar_number: string;
  ration_card_number: string;
  notes: string;
  aadhaar_doc_url: string | null;
  ration_card_doc_url: string | null;
  extra_doc_url: string | null;
  status: OrderLifecycleStatus;
  admin_remarks?: string;
}

export interface DigiPrintOrderRecord {
  id: string;
  created_at: string;
  user_id: string | null;
  user_email: string | null;
  item_id: string;
  item_title: string;
  customer_name: string;
  phone: string;
  delivery_address: string;
  quantity: number;
  custom_text: string;
  photo_url: string | null;
  status: OrderLifecycleStatus;
}

export const SUPABASE_SETUP_SQL = `CREATE TABLE IF NOT EXISTS public.service_applications (
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
  WITH CHECK (bucket_id = 'documents');`;

const LOCAL_APPS_KEY = 'dg_csc_service_applications';
const LOCAL_PRINT_KEY = 'dg_csc_digiprint_orders';

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

export async function uploadDocumentFile(file: File | null, folder: string): Promise<string | null> {
  if (!file) return null;
  try {
    const supabase = createClient();
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const filePath = `${folder}/${Date.now()}_${safeName}`;
    const { data, error } = await supabase.storage
      .from('documents')
      .upload(filePath, file, { upsert: true });

    if (!error && data?.path) {
      const { data: pub } = supabase.storage.from('documents').getPublicUrl(data.path);
      if (pub?.publicUrl) {
        return pub.publicUrl;
      }
    }
  } catch {
    // Fallback to Data URL below if storage bucket is not configured yet
  }
  return await fileToDataUrl(file);
}

export async function submitServiceApplication(
  payload: Omit<ServiceApplicationRecord, 'id' | 'created_at' | 'status'>
): Promise<{ record: ServiceApplicationRecord; syncedToSupabase: boolean; dbError?: string }> {
  const newRecord: ServiceApplicationRecord = {
    ...payload,
    id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `app_${Date.now()}`,
    created_at: new Date().toISOString(),
    status: 'Pending',
  };

  if (typeof window !== 'undefined') {
    const existing = getLocalApplications();
    localStorage.setItem(LOCAL_APPS_KEY, JSON.stringify([newRecord, ...existing]));
  }

  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('service_applications')
      .insert([
        {
          user_id: payload.user_id,
          user_email: payload.user_email,
          category_id: payload.category_id,
          category_title: payload.category_title,
          service_id: payload.service_id,
          service_title: payload.service_title,
          applicant_name: payload.applicant_name,
          phone: payload.phone,
          address: payload.address,
          aadhaar_number: payload.aadhaar_number,
          ration_card_number: payload.ration_card_number,
          notes: payload.notes,
          aadhaar_doc_url: payload.aadhaar_doc_url,
          ration_card_doc_url: payload.ration_card_doc_url,
          extra_doc_url: payload.extra_doc_url,
          status: 'Pending',
        },
      ])
      .select()
      .single();

    if (error) {
      return { record: newRecord, syncedToSupabase: false, dbError: error.message };
    }
    if (data) {
      return { record: data as ServiceApplicationRecord, syncedToSupabase: true };
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return { record: newRecord, syncedToSupabase: false, dbError: message };
  }

  return { record: newRecord, syncedToSupabase: true };
}

export async function submitDigiPrintOrder(
  payload: Omit<DigiPrintOrderRecord, 'id' | 'created_at' | 'status'>
): Promise<{ record: DigiPrintOrderRecord; syncedToSupabase: boolean; dbError?: string }> {
  const newRecord: DigiPrintOrderRecord = {
    ...payload,
    id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `print_${Date.now()}`,
    created_at: new Date().toISOString(),
    status: 'Pending',
  };

  if (typeof window !== 'undefined') {
    const existing = getLocalDigiPrintOrders();
    localStorage.setItem(LOCAL_PRINT_KEY, JSON.stringify([newRecord, ...existing]));
  }

  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('digiprint_orders')
      .insert([
        {
          user_id: payload.user_id,
          user_email: payload.user_email,
          item_id: payload.item_id,
          item_title: payload.item_title,
          customer_name: payload.customer_name,
          phone: payload.phone,
          delivery_address: payload.delivery_address,
          quantity: payload.quantity,
          custom_text: payload.custom_text,
          photo_url: payload.photo_url,
          status: 'Pending',
        },
      ])
      .select()
      .single();

    if (error) {
      return { record: newRecord, syncedToSupabase: false, dbError: error.message };
    }
    if (data) {
      return { record: data as DigiPrintOrderRecord, syncedToSupabase: true };
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return { record: newRecord, syncedToSupabase: false, dbError: message };
  }

  return { record: newRecord, syncedToSupabase: true };
}

function getLocalApplications(): ServiceApplicationRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LOCAL_APPS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function getLocalDigiPrintOrders(): DigiPrintOrderRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LOCAL_PRINT_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function fetchAllApplications(userId?: string, phoneFilter?: string): Promise<{
  records: ServiceApplicationRecord[];
  tableReady: boolean;
  errorMessage?: string;
}> {
  try {
    const supabase = createClient();
    const query = supabase
      .from('service_applications')
      .select('*')
      .order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) {
      const local = getLocalApplications();
      const filtered =
        userId || phoneFilter
          ? local.filter(
              (a) =>
                (userId && a.user_id === userId) ||
                (phoneFilter && a.phone.includes(phoneFilter))
            )
          : local;
      return { records: filtered, tableReady: false, errorMessage: error.message };
    }

    let records = (data as ServiceApplicationRecord[]) || [];
    if (userId || phoneFilter) {
      records = records.filter(
        (a) =>
          (userId && a.user_id === userId) ||
          (phoneFilter && phoneFilter.trim() !== '' && a.phone.includes(phoneFilter.trim()))
      );
    }
    return { records, tableReady: true };
  } catch (err: unknown) {
    const local = getLocalApplications();
    const message = err instanceof Error ? err.message : 'Error connecting to Supabase';
    return { records: local, tableReady: false, errorMessage: message };
  }
}

export async function fetchAllDigiPrintOrders(userId?: string, phoneFilter?: string): Promise<{
  records: DigiPrintOrderRecord[];
  tableReady: boolean;
  errorMessage?: string;
}> {
  try {
    const supabase = createClient();
    const query = supabase
      .from('digiprint_orders')
      .select('*')
      .order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) {
      const local = getLocalDigiPrintOrders();
      const filtered =
        userId || phoneFilter
          ? local.filter(
              (a) =>
                (userId && a.user_id === userId) ||
                (phoneFilter && a.phone.includes(phoneFilter))
            )
          : local;
      return { records: filtered, tableReady: false, errorMessage: error.message };
    }

    let records = (data as DigiPrintOrderRecord[]) || [];
    if (userId || phoneFilter) {
      records = records.filter(
        (a) =>
          (userId && a.user_id === userId) ||
          (phoneFilter && phoneFilter.trim() !== '' && a.phone.includes(phoneFilter.trim()))
      );
    }
    return { records, tableReady: true };
  } catch (err: unknown) {
    const local = getLocalDigiPrintOrders();
    const message = err instanceof Error ? err.message : 'Error connecting to Supabase';
    return { records: local, tableReady: false, errorMessage: message };
  }
}

export async function updateApplicationStatus(
  id: string,
  status: OrderLifecycleStatus,
  adminRemarks?: string
): Promise<boolean> {
  if (typeof window !== 'undefined') {
    const local = getLocalApplications().map((item) =>
      item.id === id ? { ...item, status, admin_remarks: adminRemarks ?? item.admin_remarks } : item
    );
    localStorage.setItem(LOCAL_APPS_KEY, JSON.stringify(local));
  }

  try {
    const supabase = createClient();
    const updateData: Record<string, unknown> = { status };
    if (adminRemarks !== undefined) {
      updateData.admin_remarks = adminRemarks;
    }
    const { error } = await supabase
      .from('service_applications')
      .update(updateData)
      .eq('id', id);
    return !error;
  } catch {
    return false;
  }
}

export async function updateDigiPrintOrderStatus(
  id: string,
  status: OrderLifecycleStatus
): Promise<boolean> {
  if (typeof window !== 'undefined') {
    const local = getLocalDigiPrintOrders().map((item) =>
      item.id === id ? { ...item, status } : item
    );
    localStorage.setItem(LOCAL_PRINT_KEY, JSON.stringify(local));
  }

  try {
    const supabase = createClient();
    const { error } = await supabase
      .from('digiprint_orders')
      .update({ status })
      .eq('id', id);
    return !error;
  } catch {
    return false;
  }
}
