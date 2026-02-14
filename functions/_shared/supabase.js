import { createClient } from '@supabase/supabase-js';

/**
 * Creates and returns a Supabase client for Cloudflare Functions.
 * Uses the Secret Key (recommended by Supabase) instead of service_role.
 *
 * @param {Object} env - The Cloudflare environment variables
 * @returns {import('@supabase/supabase-js').SupabaseClient}
 */
export const getSupabaseClient = (env) => {
  const supabaseUrl = env.SB_PROJECT_URL;
  const supabaseKey = env.SB_SECRET_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables: SB_PROJECT_URL or SB_SECRET_KEY');
  }

  return createClient(supabaseUrl, supabaseKey);
};
