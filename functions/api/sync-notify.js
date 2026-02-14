import { getSupabaseClient } from '../_shared/supabase.js';

/**
 * Cloudflare Pages Function: /api/sync-notify
 * 
 * Triggers Worker sync by fetching the current sync key from Supabase
 * and passing it to the Worker. This ensures only authorized requests
 * can trigger syncs.
 * 
 * The sync key rotates after each successful sync for security.
 */
export async function onRequest(context) {
  try {
    const supabase = getSupabaseClient(context.env);

    // Fetch current sync key from Supabase
    const { data: metadata, error } = await supabase
      .from('sync_metadata')
      .select('current_sync_key')
      .single();

    if (error || !metadata || !metadata.current_sync_key) {
      console.error('[Sync Notify] Failed to fetch sync key:', error?.message);
      return new Response('Failed to retrieve sync key', { status: 500 });
    }

    const currentKey = metadata.current_sync_key;
    console.log('[Sync Notify] Retrieved sync key, triggering worker...');

    // Call Worker with current sync key
    // Call Worker
    const workerUrl = 'https://barcalive-sync.natekkz.workers.dev/trigger';

    const response = await fetch(workerUrl);
    const data = await response.text();

    // Log for debugging (without exposing key)
    console.log('[Sync Notify] Worker response:', response.status, data.substring(0, 100));

    return new Response(data, {
      status: response.status,
      headers: {
        'Content-Type': 'text/plain',
        'Cache-Control': 'no-store'
      }
    });

  } catch (error) {
    console.error('[Sync Notify] Error:', error.message);
    return new Response('Error triggering sync: ' + error.message, { status: 500 });
  }
}
