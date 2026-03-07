import { CONFIG } from './config.js';
import { barcaState } from './state.js';
import { normalizeData } from './normalize.js';

/**
 * BarcaAPI — Core data management singleton.
 * Now uses api.barcalive.online directly.
 */
class BarcaAPI {
  constructor() {
    if (BarcaAPI._instance) return BarcaAPI._instance;
    BarcaAPI._instance = this;

    /** @private */ this._subscribers = [];
    /** @private */ this._pollTimer = null;
    /** @private */ this._currentIso = 'PL';
    /** @private */ this._data = null;
  }

  /* ───────── Public API ───────── */

  /** Subscribe to global data changes (mostly for Live updates). */
  onData(callback) {
    this._subscribers.push(callback);
  }

  /** Returns latest fetched data */
  getData() {
    return this._data;
  }

  /**
   * Fetches Overview data (Match data)
   * @param {string} [iso] - Country code for TV stations (default: local or PL)
   */
  async getOverview(iso) {
    // Use user's saved ISO or passed ISO or detect from browser
    let userIso = iso || localStorage.getItem('bp_region');

    if (!userIso) {
      try {
        const navLang = navigator.language || navigator.userLanguage;
        if (navLang) {
          // Extract region if present (e.g. "pl-PL" -> "PL", "en-GB" -> "GB")
          // If just "pl" -> "PL"
          if (navLang.includes('-')) {
            userIso = navLang.split('-')[1].toUpperCase();
          } else {
            userIso = navLang.toUpperCase();
          }
        }
      } catch (e) { console.warn('[BarcaAPI] ISO detection failed', e); }
    }

    // Default to empty string if detection returned nothing or failed
    // This ensures we don't show Polish TV (PL) to users who aren't in PL or detected regions
    userIso = userIso || 'PL'; // FALLBACK TO PL IF DETECTION FAILS (Better UX than nothing)
    this._currentIso = userIso;

    // PERSIST DETECTED REGION
    if (!localStorage.getItem('bp_region')) {
      localStorage.setItem('bp_region', userIso);
    }

    const endpoint = `${CONFIG.ENDPOINTS.matches}&iso=${userIso}`;

    // Network Fetch (always update)
    const data = await this._fetchAndNotify(endpoint);

    // Start polling if we are in a match window (handled internally by _schedulePoll)
    this._checkPolling(data);

    return data;
  }

  async getLaLiga() {
    return await this._fetchAndNotify(CONFIG.ENDPOINTS.laliga);
  }

  async getUCL() {
    return await this._fetchAndNotify(CONFIG.ENDPOINTS.ucl);
  }

  async getSchedule(type = 'next') {
    const endpoint = type === 'prev' ? CONFIG.ENDPOINTS.prev : CONFIG.ENDPOINTS.next;
    return await this._fetchAndNotify(endpoint);
  }

  /** Placeholder for initialization if needed */
  async init() {
    // No longer pre-loading big cache. 
    // Pages will request what they need.
  }

  /* ───────── Private ───────── */

  /** @private SWR Cache TTL in ms (5 minutes) */
  static _CACHE_TTL = 5 * 60 * 1000;

  /** Read from sessionStorage cache */
  _getCache(key) {
    try {
      const raw = sessionStorage.getItem(key);
      if (!raw) return null;
      const { data, ts } = JSON.parse(raw);
      if (Date.now() - ts > BarcaAPI._CACHE_TTL) {
        sessionStorage.removeItem(key);
        return null;
      }
      return data;
    } catch { return null; }
  }

  /** Write to sessionStorage cache */
  _setCache(key, data) {
    try {
      sessionStorage.setItem(key, JSON.stringify({ data, ts: Date.now() }));
    } catch { /* quota exceeded — ignore */ }
  }

  async _fetchAndNotify(endpoint) {
    try {
      // 1. Stale-While-Revalidate: show cached data instantly
      const cacheKey = `bl_cache_${endpoint}`;
      const cached = this._getCache(cacheKey);
      if (cached) {
        const staleData = normalizeData(cached);
        this._data = staleData;
        this._notify(staleData);
        // Don't show loading state — user sees content immediately
      } else {
        barcaState.setState('loading');
      }

      // 2. Network fetch (background revalidation)
      const url = `${CONFIG.API_BASE_URL}${endpoint}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const raw = await res.json();
      this._setCache(cacheKey, raw);
      const data = normalizeData(raw);

      // Cache for synchronous access (e.g. theme toggles)
      this._data = data;

      // Notify subscribers (render pipeline)
      this._notify(data);

      barcaState.setState('idle');
      return data;
    } catch (err) {
      console.error('[BarcaAPI] Fetch failed:', err);
      barcaState.setState('error');
      // If we had stale data, return it so page isn't blank
      return this._data || null;
    }
  }

  _notify(data) {
    for (const cb of this._subscribers) {
      try { cb(data); } catch (e) { console.error(e); }
    }
  }

  /* ───────── Polling Logic for Live Matches ───────── */

  _checkPolling(data) {
    if (!data?.matches) return; // Only poll if we have match data

    // Check for live or upcoming-soon logic
    const hasLive = data.matches.live?.length > 0;
    const upcomingSoon = data.matches.upcoming?.some(m => {
      const start = new Date(m.startTime).getTime();
      return Math.abs(start - Date.now()) < 30 * 60 * 1000;
    });

    const shouldPoll = hasLive || upcomingSoon;

    if (this._pollTimer) clearTimeout(this._pollTimer);

    if (shouldPoll) {
      barcaState.setState('live');
      console.log('[BarcaAPI] ⚡ Live mode active');
      this._pollTimer = setTimeout(() => {
        this.getOverview(this._currentIso);
      }, CONFIG.REFRESH_INTERVALS.matchMode);
    } else {
      // Stop polling or poll slowly?
      // For now, if not live, we don't auto-refresh heavily.
      // Maybe slow refresh?
    }
  }
}

export const barcaAPI = new BarcaAPI();
