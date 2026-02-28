/**
 * normalize.js — Data Normalizer for BarcaLive
 *
 * Transforms raw Supabase/API JSON into a canonical flat shape.
 * Called once inside api.js _applyData() before notifying subscribers.
 *
 * GOAL: every match object — upcoming, live, or finished — uses the
 *       exact same flat structure so renderers never need fallback chains.
 */

import { getTeamCrestUrl, getTeamLogoUrl } from './assets.js';

/* ─── Single-match normalizer ──────────────────────────────────────── */

function normalizeMatch(raw) {
    if (!raw) return null;

    // Team helper: merge nested & flat shapes into one object
    // API v2 uses 'home' and 'away' objects directly
    const team = (nested, flatName, flatCrest) => ({
        id: nested?.id ?? null,
        name: nested?.name || flatName || 'TBD',
        shortName: nested?.shortName || nested?.name || flatName || 'TBD',
        crest: getTeamLogoUrl(nested?.crest || flatCrest) || (nested?.id ? getTeamCrestUrl(nested.id) : ''),
    });

    // Handle v2 'home'/'away' or v1 'homeTeam'/'awayTeam'
    const homeRaw = raw.home || raw.homeTeam;
    const awayRaw = raw.away || raw.awayTeam;

    const homeTeam = team(homeRaw, raw.homeTeamName, raw.homeTeamCrest);
    const awayTeam = team(awayRaw, raw.awayTeamName, raw.awayTeamCrest);

    // Live details fallback
    const live = raw.liveDetails || {};

    // Score: prefer top-level flat fields -> nested score -> liveDetails
    const homeScore = raw.homeScore ?? raw.score?.home ?? raw.score?.fullTime?.home ?? live.homeScore ?? null;
    const awayScore = raw.awayScore ?? raw.score?.away ?? raw.score?.fullTime?.away ?? live.awayScore ?? null;

    // Competition: merge various shapes
    let comp = {};
    if (typeof raw.competition === 'string') {
        comp = { name: raw.competition, code: '', displayName: raw.competition };
    } else {
        comp = raw.competition || {};
    }

    const competition = {
        code: comp.code || '',
        name: comp.name || '',
        displayName: raw.competitionDisplayName || comp.displayName || comp.name || '',
        type: raw.competitionType || comp.code || '',
        id: comp.id ?? null,
    };

    // TV Channels
    let tvChannels = [];
    if (raw.tv && Array.isArray(raw.tv.stations)) {
        tvChannels = raw.tv.stations;
    } else if (Array.isArray(raw.tvChannels)) {
        tvChannels = raw.tvChannels;
    }

    // Status: prefer appStatus (formatted 'IN_PLAY') over raw status ('first_half')
    const status = raw.appStatus || raw.status || live.status || 'SCHEDULED';
    const minute = raw.minute ?? live.minute ?? null;

    // Extract details from liveDetails or root
    const venueRaw = live.venue || raw.venue || {};
    const venue = venueRaw.name || venueRaw.city ? `${venueRaw.name || ''} ${venueRaw.city ? '(' + venueRaw.city + ')' : ''}`.trim() : null;

    const refRaw = live.referee || raw.referee || {};
    const referee = refRaw.displayShortName || refRaw.displayName || refRaw.name || null;

    const roundRaw = live.activeStage || live.stage || raw.stage || raw.bracketRound || {};
    const round = roundRaw.displayShortName || roundRaw.displayName || roundRaw.name || raw.round || null;

    const homeWinChance = raw.odds?.homeWin || raw.homeWinChance || null;
    const drawChance = raw.odds?.draw || raw.drawChance || null;
    const awayWinChance = raw.odds?.awayWin || raw.awayWinChance || null;

    return {
        id: raw.id ?? null,
        startTime: raw.startTime || raw.utcDate || null,
        status: status,
        minute: minute,

        homeTeam,
        awayTeam,
        homeScore,
        awayScore,

        competition,

        stage: raw.stage || raw.stageName || null,
        round,
        displayName: raw.displayName || null,
        venue,
        referee,

        homeWinChance,
        drawChance,
        awayWinChance,

        homeShirtColor: raw.homeShirtColor || '#A50044',
        awayShirtColor: raw.awayShirtColor || '#4a90d9',

        tvChannels,

        // Pass through any extra fields renderers might use
        competitionPosition: raw.competitionPosition ?? null,
    };
}

/* ─── Full dataset normalizer ──────────────────────────────────────── */

// ⚡ Bolt Optimization: Instantiate constant Sets once outside the execution context
const UPCOMING_STATUSES = new Set(['SCHEDULED', 'TIMED', 'POSTPONED']);
const LIVE_STATUSES = new Set(['IN_PLAY', 'PAUSED', 'HALFTIME', 'first_half', 'second_half', 'half_time', 'LIVE']);

/**
 * Normalize the entire data object from API.
 * @param {Object} raw — the raw JSON response
 * @returns {Object}   — standardized structure { matches: {...}, standings: [...] }
 */
export function normalizeData(raw) {
    if (!raw) return {};

    const data = {};

    // 1. Matches Response (Overview, Schedule)
    if (raw.matches) {
        data.matches = {};
        if (Array.isArray(raw.matches.upcoming)) {
            data.matches.upcoming = raw.matches.upcoming.map(normalizeMatch).filter(Boolean);
        }
        if (Array.isArray(raw.matches.live)) {
            data.matches.live = raw.matches.live.map(normalizeMatch).filter(Boolean);
        }
        if (Array.isArray(raw.matches.finished)) {
            data.matches.finished = raw.matches.finished.map(normalizeMatch).filter(Boolean);
        }
        // Handle data=next / data=prev where matches is an array directly? 
        // Prompt says: {"type":"next","matches":[...]}
        if (Array.isArray(raw.matches)) {
            // Determine if upcoming or finished based on type or status
            // But usually 'next' implies upcoming, 'prev' finished.
            // We can map them to 'upcoming' generic bucket or specific based on status.

            // For safety, let's put them in both or infer.
            // If the request was for schedule, we might just want a flat list.
            // But render.js expects upcoming/live/finished keys for some views?
            // Actually renderScheduleList uses window._renderScheduleData which is data.matches.
            // If data.matches is an array, renderScheduleList might break if it expects .upcoming

            // Let's coerce array to object Structure
            const all = raw.matches.map(normalizeMatch).filter(Boolean);

            // ⚡ Bolt Optimization: Single-pass O(n) loop with Set O(1) lookup
            data.matches.upcoming = [];
            data.matches.finished = [];
            data.matches.live = [];

            for (let i = 0; i < all.length; i++) {
                const m = all[i];
                if (m.status === 'FINISHED') {
                    data.matches.finished.push(m);
                } else if (UPCOMING_STATUSES.has(m.status)) {
                    data.matches.upcoming.push(m);
                } else if (LIVE_STATUSES.has(m.status)) {
                    data.matches.live.push(m);
                }
            }
        }
    }

    // 2. Standings Response (La Liga, UCL)
    // API returns: { competition: "La Liga", table: [...] }
    if (raw.table) {
        data.standings = [{
            competition: { name: raw.competition, code: '' }, // Inferred
            table: raw.table,
            type: 'TOTAL'
        }];
    } else if (raw.standings) {
        data.standings = raw.standings;
    }

    // Pass through if nothing matched (e.g. empty object)
    return data;
}
