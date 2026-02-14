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
    // 1. Use passed ISO if available
    let userIso = iso;

    // 2. If no ISO passed, detect from browser (ALWAYS try detection to respect headers)
    if (!userIso) {
      try {
        const navLang = navigator.language || navigator.userLanguage;
        if (navLang) {
          // Extract region if present (e.g. "pl-PL" -> "PL", "en-GB" -> "GB")
          // If just "pl" -> "PL" (technically language code, but often used as region fallback)
          if (navLang.includes('-')) {
            userIso = navLang.split('-')[1].toUpperCase();
          } else {
            userIso = navLang.toUpperCase();
          }
        }
      } catch (e) { console.warn('[BarcaAPI] ISO detection failed', e); }
    }

    // 3. Fallback to 'PL' only if detection failed
    userIso = userIso || 'PL';
    this._currentIso = userIso;

    // PERSIST DETECTED REGION (for other parts of app, but we don't prioritize it over fresh detection)
    localStorage.setItem('bp_region', userIso);

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

  async _fetchAndNotify(endpoint) {
    barcaState.setState('loading');
    try {
      const url = `${CONFIG.API_BASE_URL}${endpoint}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const raw = await res.json();
      const data = normalizeData(raw);

      // Cache for synchronous access (e.g. theme toggles)
      this._data = data;

      // Notify subscribers (legacy support for render pipeline)
      this._notify(data);

      barcaState.setState('idle');
      return data;
    } catch (err) {
      console.error('[BarcaAPI] Fetch failed:', err);
      barcaState.setState('error');
      return null;
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
