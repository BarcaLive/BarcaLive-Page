/**
 * assets/js/core/logos.js
 * * Logo URL resolution helpers.
 * All assets load from Supabase Storage bucket "logos".
 */

import { CONFIG } from './config.js';

const STORAGE = CONFIG.STORAGE_BASE;

// ── Channel name → logo filename ──────────────────────────────────────
const CHANNEL_LOGO_MAP = {
    "Canal+ Sport": "canal-plus-sport-pl.webp",
    "Canal+ Sport 2": "canal-plus-sport-2-pl.webp",
    "Canal+ Sport 3": "canal-plus-sport-3-pl.webp",
    "Canal+ Sport 4": "canal-plus-sport-4-pl.webp",
    "Canal+ Sport 5": "canal-plus-sport-5-pl.webp",
    "Canal+ Now": "canal-plus-now-pl.webp",
    "DAZN": "dazn-int.webp",
    "DAZN 1": "dazn1-int.webp",
    "DAZN 2": "dazn2-int.webp",
    "Eleven Sports": "eleven-sports-int.webp",
    "Eleven Sports 1": "eleven-sports-1-int.webp",
    "Eleven Sports 2": "eleven-sports-2-int.webp",
    "Eleven Sports 3": "eleven-sports-3-int.webp",
    "Eleven Sports 4": "eleven-sports-4-int.webp",
    "Eleven Sports 5": "eleven-sports-5-int.webp",
    "Eleven Sports 6": "eleven-sports-6-int.webp",
    "Polsat Sport": "polsat-sport-pl.webp",
    "Polsat Sport 1": "polsat-sport-1-pl.webp",
    "Polsat Sport 2": "polsat-sport-2-pl.webp",
    "Polsat Sport 3": "polsat-sport-3-pl.webp",
    "Polsat Sport Extra": "polsat-sport-extra-pl.webp",
    "Polsat Sport Extra 1": "polsat-sport-extra-1-pl.webp",
    "Polsat Sport Extra 2": "polsat-sport-extra-2-pl.webp",
    "Polsat Sport Extra 3": "polsat-sport-extra-3-pl.webp",
    "Polsat Sport Extra 4": "polsat-sport-extra-4-pl.webp",
    "Polsat Sport Fight": "polsat-sport-fight-pl.webp",
    "Polsat Sport News": "polsat-sport-news-pl.webp",
    "Polsat Sport Premium 1": "polsat-sport-premium-1-pl.webp",
    "Polsat Sport Premium 2": "polsat-sport-premium-2-pl.webp",
    "Red Bull TV": "red-bull-tv-int.webp",
    "TVP Sport": "tvp-sport-pl.webp",
    "TVP Sport HD": "tvp-sport-hd-pl.webp",
};

// ── Competition display name → logo filename ──────────────────────────
const COMPETITION_LOGO_MAP = {
    "Champions League": "cl",
    "UEFA Champions League": "cl",
    "Liga Mistrzów": "cl",
    "La Liga": "pd",
    "Primera Division": "pd",
    "LaLiga EA Sports": "pd",
    "Primera División": "pd",
    "Copa del Rey": "cdr",
    "Puchar Króla": "cdr",
    "Supercopa de Espana": "scde",
    "Superpuchar Hiszpanii": "scde",
    "Superpuchar": "scde"
};

function withSupabaseImageTransform(url, { width, height, quality = 70, format = 'webp' } = {}) {
    if (!url) return '';
    if (!(width || height || quality || format)) return url;

    try {
        const u = new URL(url);
        if (width) u.searchParams.set('width', String(width));
        if (height) u.searchParams.set('height', String(height));
        if (quality) u.searchParams.set('quality', String(quality));
        if (format) u.searchParams.set('format', String(format));
        return u.toString();
    } catch {
        // Fallback for relative / invalid URLs
        const params = [];
        if (width) params.push(`width=${encodeURIComponent(width)}`);
        if (height) params.push(`height=${encodeURIComponent(height)}`);
        if (quality) params.push(`quality=${encodeURIComponent(quality)}`);
        if (format) params.push(`format=${encodeURIComponent(format)}`);
        if (!params.length) return url;
        return url + (url.includes('?') ? '&' : '?') + params.join('&');
    }
}

/* ── Public helpers ─────────────────────────────────────────────────── */

const _crestCache = new Map();
const _channelCache = new Map();
const _compCache = new Map();

/**
 * Team crest URL from BarcaLive team ID.
 * Builds: bucket/teams/{id}.webp
 * @param {number|string} teamId — BarcaLive internal team ID
 * @returns {string} full URL or empty string
 */
export function getTeamCrestUrl(teamId) {
    if (_crestCache.has(teamId)) return _crestCache.get(teamId);

    const url = teamId ? `${STORAGE}/teams/${teamId}.webp` : '';
    // Default: small crest (common usage in tables/lists). Override by appending your own params if needed.
    const result = withSupabaseImageTransform(url, { width: 96, height: 96, quality: 70, format: 'webp' });

    _crestCache.set(teamId, result);
    return result;
}

/**
 * Team crest URL — pass-through for legacy code that already has the URL.
 */
export function getTeamLogoUrl(crestUrl) {
    return withSupabaseImageTransform(crestUrl, { width: 96, height: 96, quality: 70, format: 'webp' });
}

/**
 * Channel logo URL from display name.
 * Returns empty string if channel is unknown.
 */
export function getChannelLogoUrl(channelName) {
    if (_channelCache.has(channelName)) return _channelCache.get(channelName);

    const file = CHANNEL_LOGO_MAP[channelName];
    const url = file ? `${STORAGE}/channel/${file}` : '';
    const result = withSupabaseImageTransform(url, { width: 100, height: 100 });

    _channelCache.set(channelName, result);
    return result;
}

/**
 * Competition logo URL from display name.
 * @param {string} name  e.g. "La Liga", "Champions League"
 * @param {string} theme "dark" (default) or "light"
 */
export function getCompetitionLogoUrl(name, theme = 'dark') {
    if (!name) return '';
    const key = `${name}|${theme}`;
    if (_compCache.has(key)) return _compCache.get(key);

    // 1. Try exact match
    let code = COMPETITION_LOGO_MAP[name];

    // 2. Fuzzy match fallback
    if (!code) {
        if (name.includes('Champions') || name.includes('Mistrzów')) code = 'cl';
        else if (name.includes('Liga') || name.includes('Primera')) code = 'pd';
        else if (name.includes('Rey') || name.includes('Króla')) code = 'cdr';
        else if (name.includes('Super')) code = 'scde';
    }

    const url = code ? `${STORAGE}/competition/${code}-${theme}.webp` : '';
    const result = withSupabaseImageTransform(url, { width: 96, height: 96 });

    _compCache.set(key, result);
    return result;
}