import { createClient } from '@supabase/supabase-js';

/**
 * Pages Function: /api/data
 * Returns cached data from Supabase with fallback to n8n API if empty
 */
export async function onRequest(context) {
    try {
        // Validate environment variables using the names provided by the user
        const supabaseUrl = context.env.SUPABASE_URL;
        // Check for both commonly used key names
        const supabaseKey = context.env.SUPABASE_ANON_KEY || context.env.SUPABASE_PUBLISHABLE_KEY;

        if (!supabaseUrl || !supabaseKey) {
            console.error('[API] Missing environment variables:', {
                hasUrl: !!supabaseUrl,
                hasKey: !!supabaseKey
            });
            throw new Error('Server misconfiguration: Missing Supabase credentials');
        }

        // Use Anon Key (safe - RLS allows read-only access)
        const supabase = createClient(supabaseUrl, supabaseKey);

        // Fetch matches
        const { data: matchesData, error: matchesError } = await supabase
            .from('barca_matches')
            .select('*')
            .order('utc_date', { ascending: true }); // Sort by date ascending (oldest -> newest)

        if (matchesError) {
            console.error('[API] Matches error:', matchesError);
            throw matchesError;
        }

        // Fetch standings
        const { data: standingsData, error: standingsError } = await supabase
            .from('barca_standings')
            .select('*')
            .order('id', { ascending: false });

        if (standingsError) {
            console.error('[API] Standings error:', standingsError);
            throw standingsError;
        }

        // Check if Supabase has data - if not, fallback to API
        const hasData = matchesData && matchesData.length > 0;

        if (!hasData) {
            console.log('[API] No data in Supabase - fetching from n8n API (fallback)');

            // Fetch directly from n8n API
            const apiUrl = 'https://api.barcalive.online/';
            const apiResponse = await fetch(apiUrl);

            if (!apiResponse.ok) {
                throw new Error(`API fallback failed: ${apiResponse.status}`);
            }

            let apiData = await apiResponse.json();

            // Handle array wrapper if present
            if (Array.isArray(apiData)) {
                apiData = apiData[0];
            }

            console.log('[API] Returning data from n8n API');

            return new Response(JSON.stringify(apiData), {
                status: 200,
                headers: {
                    'Content-Type': 'application/json',
                    'Cache-Control': 'public, max-age=60',
                    'X-Data-Source': 'n8n-API-Fallback'
                }
            });
        }

        // Helper to map match row to API format
        const mapMatch = (m) => {
            // If the row uses snake_case keys from DB, map them.
            // If it already has camelCase (from a JSON column we missed), use it.
            // Priority: m.data (legacy/json) -> m (raw row)

            const src = m.data || m;

            return {
                id: src.id,
                status: src.status,
                utcDate: src.utc_date || src.utcDate,
                matchday: src.match_day || src.matchday,
                stage: src.stage,
                homeTeam: src.home_team || src.homeTeam,
                awayTeam: src.away_team || src.awayTeam,
                score: src.score,
                competition: src.competition,
                referees: src.referees,
                venue: src.venue,
                tvChannels: src.tv_channels || src.tvChannels
            };
        };

        const matches = (matchesData || [])
            .filter(item => item !== null)
            .map(mapMatch)
            // Explicitly sort by date to be absolutely sure
            .sort((a, b) => new Date(a.utcDate) - new Date(b.utcDate));

        const standings = (standingsData || [])
            .map(s => s.standings_data || s.data || s) // Handle the new schema (standings_data)
            .filter(item => item !== null);

        // Categorize matches
        const categorized = {
            live: [],
            upcoming: [],
            finished: []
        };

        for (const match of matches) {
            // Safety check for match object structure
            if (!match || typeof match !== 'object') continue;

            const status = match.status?.toLowerCase();
            // Check for 'in_play' OR 'live' OR 'paused' etc.
            if (['live', 'in_play', 'paused', 'halftime'].includes(status)) {
                categorized.live.push(match);
            } else if (status === 'finished') {
                categorized.finished.push(match);
            } else {
                categorized.upcoming.push(match);
            }
        }

        // Use newest finished matches first
        categorized.finished.reverse();

        const response = {
            matches: categorized,
            standings: standings
        };

        return new Response(JSON.stringify(response), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'public, max-age=60',
                'X-Data-Source': 'Supabase'
            }
        });

    } catch (error) {
        console.error('[API] Critical Error:', error.message);
        // Don't expose internal error details in production, but log them
        return new Response(
            JSON.stringify({
                error: 'Internal Server Error',
                message: error.message // Temporarily include message for debugging
            }),
            {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            }
        );
    }
}
