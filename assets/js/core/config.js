/**
 * Global configuration for BarcaLive Core System
 * Single source of truth for all endpoints, keys, and intervals.
 */
export const CONFIG = {
  API_BASE_URL: 'https://api.barcalive.online',
  ENDPOINTS: {
    matches: '/?data=match',
    next: '/?data=next',
    prev: '/?data=prev',
    laliga: '/?data=laliga',
    ucl: '/?data=ucl'
  },
  // Supabase Storage for logos
  STORAGE_BASE: "https://bwmkvehxzcdzdxiqdqin.supabase.co/storage/v1/object/public/logos",

  // Polling intervals (ms)
  REFRESH_INTERVALS: {
    matchMode: 30000,   // 30s during live match window
    standard: 300000    // 5min idle check
  },

  // Barcelona team ID (BarcaLive internal)
  BARCA_ID: 2017
};
