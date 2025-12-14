import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Gift = {
  id: string;
  recipient: string;
  amount: string;
  token: string;
  pda: string;
  message?: string;
  created_at: string;
  claimed: boolean;
  claimed_at?: string;
};
