/**
 * Prefetch Engine for BarcaLive SPA
 * Handles background loading of pages to ensure instant navigation.
 * Singleton pattern (Class-based).
 */
export class BarcaPrefetch {
  constructor() {
    if (BarcaPrefetch.instance) {
      return BarcaPrefetch.instance;
    }

    /** @private */
    this.cache = new Map(); // url -> htmlString
    /** @private */
    this.pending = new Set();
    /** @private */
    this.hoverTimeout = null;

    BarcaPrefetch.instance = this;
  }

  /**
   * Fetches page content and stores it in the internal cache
   * @param {string} url - The URL to prefetch
   * @returns {Promise<string|null>} - Returns the fetched HTML or null on failure
   */
  async prefetch(url) {
    // Return from cache if already exists
    if (this.cache.has(url)) {
      return this.cache.get(url);
    }

    // Skip if already fetching
    if (this.pending.has(url)) return null;

    try {
      this.pending.add(url);
      
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
      
      const html = await response.text();
      this.cache.set(url, html);
      
      return html;
    } catch (error) {
      console.warn(`[BarcaPrefetch] Failed to prefetch ${url}:`, error);
      return null;
    } finally {
      this.pending.delete(url);
    }
  }

  /**
   * Initial prefetch for a list of critical URLs
   * @param {string[]} urls - Array of URLs to prefetch on startup
   */
  warmup(urls) {
    if (!Array.isArray(urls)) return;
    urls.forEach(url => this.prefetch(url));
  }

  /**
   * Set up hover-based prefetching
   * Triggered when user hovers over a SPA link for more than 100ms.
   */
  init() {
    document.addEventListener('mouseenter', (e) => {
      if (!e.target || typeof e.target.closest !== 'function') return;
      
      const link = e.target.closest('a[data-spa="true"]');
      if (!link) return;

      const url = link.getAttribute('href');
      if (!url || this.cache.has(url)) return;

      this.hoverTimeout = setTimeout(() => {
        this.prefetch(url);
      }, 100);
    }, true);

    document.addEventListener('mouseleave', (e) => {
      if (!e.target || typeof e.target.closest !== 'function') return;

      const link = e.target.closest('a[data-spa="true"]');
      if (!link) return;

      if (this.hoverTimeout) {
        clearTimeout(this.hoverTimeout);
        this.hoverTimeout = null;
      }
    }, true);
  }

  /**
   * Retrieves content from cache if available
   * @param {string} url 
   * @returns {string|null}
   */
  getCached(url) {
    return this.cache.get(url) || null;
  }
}

// Export a single instance (Singleton)
export const barcaPrefetch = new BarcaPrefetch();
