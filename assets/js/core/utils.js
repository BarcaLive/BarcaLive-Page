/**
 * Utility functions for BarcaLive Core System
 */

// ⚡ Bolt Optimization: Cache Intl.DateTimeFormat instances
const _utilsDateFormatterCache = new Map();
const getUtilsFormatter = (lang, options) => {
  const key = `${lang}|${JSON.stringify(options)}`;
  if (!_utilsDateFormatterCache.has(key)) {
    _utilsDateFormatterCache.set(key, new Intl.DateTimeFormat(lang, options));
  }
  return _utilsDateFormatterCache.get(key);
};

/**
 * Formats match time from ISO string or returns live status
 * @param {string} isoString - ISO date string of the match
 * @returns {string} Formatted time (e.g., "21:00") or "LIVE 67'"
 */
export const formatMatchTime = (isoString) => {
  if (!isoString) return "";
  const date = new Date(isoString);

  if (isNaN(date.getTime())) return isoString;

  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);

  // Auto-detect LIVE status (matches started in the last 135 minutes)
  if (diffMins >= 0 && diffMins <= 135) {
    if (diffMins > 45 && diffMins <= 60) return "HT";
    const actualMin = diffMins > 60 ? diffMins - 15 : diffMins;
    return `${actualMin}'`;
  }

  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');

  return `${hours}:${minutes}`;
};

/**
 * Formats ISO date string to Polish date format
 * @param {string} isoString - ISO date string
 * @returns {string} Formatted date (e.g., "Sob, 15 Lut")
 */
export const formatDate = (isoString) => {
  if (!isoString) return "";
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return isoString;

  if (window.I18n && typeof window.I18n.formatDate === 'function') {
    return window.I18n.formatDate(isoString, { weekday: 'short', month: 'short', day: 'numeric' });
  }

  return getUtilsFormatter(undefined, { weekday: 'short', month: 'short', day: 'numeric' }).format(date);
};

/**
 * Debounce function to limit execution frequency
 * @param {Function} fn - Function to debounce
 * @param {number} ms - Delay in milliseconds
 * @returns {Function}
 */
export const debounce = (fn, ms = 300) => {
  let timeoutId;
  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn.apply(this, args), ms);
  };
};

/**
 * Throttle function to limit execution frequency
 * @param {Function} fn - Function to throttle
 * @param {number} ms - Throttle interval in milliseconds
 * @returns {Function}
 */
export const throttle = (fn, ms = 300) => {
  let lastCall = 0;
  return function (...args) {
    const now = Date.now();
    if (now - lastCall >= ms) {
      lastCall = now;
      return fn.apply(this, args);
    }
  };
};

/**
 * Checks if the browser is online
 * @returns {boolean}
 */
export const isOnline = () => typeof navigator !== 'undefined' ? navigator.onLine : true;

/**
 * Updates all elements with id="date-display" with current date
 */
export const updateDateDisplay = () => {
  const dateEl = document.getElementById('date-display');
  if (!dateEl) return;

  const today = new Date();
  const options = { weekday: 'long', month: 'long', day: 'numeric' };

  let dateStr;
  const lang = (window.I18n && window.I18n.currentLang) || 'en';

  if (window.I18n && typeof window.I18n.getPrettyDate === 'function') {
    dateStr = window.I18n.getPrettyDate(today.toISOString(), lang);
  } else if (window.I18n && typeof window.I18n.formatDate === 'function') {
    dateStr = window.I18n.formatDate(today, options);
  } else {
    dateStr = getUtilsFormatter(undefined, options).format(today);
  }

  // Use textContent to replace the dots with the actual date
  dateEl.textContent = dateStr;
  dateEl.className = "text-[10px] font-bold uppercase tracking-[0.2em] text-gold mb-2 block";
};
