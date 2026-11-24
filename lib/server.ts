import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js';
import defaults from './defaults.json';

let serverClient: SupabaseClient | undefined;

export function db(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim().replace(/\/+$/, '');
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!url || !/^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(url)) {
    throw new Error('Invalid NEXT_PUBLIC_SUPABASE_URL: use https://PROJECT-ID.supabase.co (without /rest/v1)');
  }
  if (!key || key.startsWith('YOUR_')) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is missing');
  }
  if (!serverClient) {
    serverClient = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return serverClient;
}

export async function settings() {
  const { data, error } = await db().from('settings').select('data').eq('id', 1).single();
  if (error) throw new Error(`Settings database error (${error.code}): ${error.message}`);
  return { ...defaults, ...(data?.data ?? {}) };
}

export async function identity(req: Request): Promise<User | null> {
  const header = req.headers.get('authorization') ?? '';
  const token = /^Bearer\s+(.+)$/i.exec(header)?.[1];
  if (!token) return null;
  const { data, error } = await db().auth.getUser(token);
  if (error) {
    // Invalid/expired token means this request is unauthenticated.
    console.warn('[AUTH] Invalid or expired session:', error.message);
    return null;
  }
  return data.user ?? null;
}
