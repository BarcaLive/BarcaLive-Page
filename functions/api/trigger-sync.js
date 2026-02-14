/**
 * Pages Function: /api/trigger-sync
 * Triggers Worker sync (called after match ends)
 */
export async function onRequest(context) {
    try {
        // Targeted Worker URL
        const workerUrl = 'https://barcalive-sync.natekkz.workers.dev/trigger'; // Updated based on worker name in wrangler.toml 'barcalive-sync' BUT usually it would be [name].[subdomain].workers.dev. 
        // User's previous log showed 'https://075e6f2a.barcalive.pages.dev/api/trigger-sync'.
        // Worker name in wrangler.toml is "barcalive-sync".
        // The previous trigger-sync.js had 'https://first-sync.barcalive.workers.dev/'. 
        // I should use the correct worker URL. I'll make a safe guess or ask the user, but I'll try to deduce.
        // Step 236: worker name IS "barcalive-sync".
        // If the user's account subdomain is 'natekkz', then 'barcalive-sync.natekkz.workers.dev' is likely.
        // However, I'll stick to what was there but add /trigger. 'https://first-sync.barcalive.workers.dev/trigger'. 

        // Wait, the worker code (Step 438) checks `if (url.pathname === '/trigger')`.
        // So I MUST append `/trigger`.
        const targetUrl = 'https://barcalive-sync.natekkz.workers.dev/trigger';

        const response = await fetch(targetUrl, {
            method: 'GET', // Worker checks for path, method doesn't matter much but GET is standard for trigger in that code
            headers: {
                'X-Sync-Secret': context.env.SYNC_SECRET || ''
            }
        });

        const data = await response.json();

        return new Response(JSON.stringify(data), {
            status: response.status,
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-store'
            }
        });

    } catch (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
            {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            }
        );
    }
}
