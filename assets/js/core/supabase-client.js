import { createClient } from 'https://esm.sh/@supabase/supabase-js';
import { CONFIG } from './config.js';

/**
 * Singleton Supabase Client for the Frontend.
 * Uses the SB_PUBLISHABLE_KEY which respects Row Level Security (RLS).
 */
export const supabase = createClient(CONFIG.SUPABASE.url, CONFIG.SUPABASE.anonKey);
