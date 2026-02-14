import { barcaState } from '../core/state.js';
import { barcaPrefetch } from './prefetch.js';
import { BarcaTransitions } from './transitions.js';
import { updateDateDisplay } from '../core/utils.js';

/**
 * SPA Router for BarcaLive
 * Manages client-side navigation, history, and content updates.
 * Singleton pattern (Class-based).
 */
export class BarcaRouter {
  constructor() {
    if (BarcaRouter.instance) {
      return BarcaRouter.instance;
    }

    /** @private */
    this.transitions = new BarcaTransitions();
    /** @private */
    this.container = null;

    BarcaRouter.instance = this;
  }

  /**
   * Initializes the router, intercepts links and handles history changes.
   */
  init() {
    this.container = document.getElementById('app-content');

    // Intercept clicks on links with data-spa="true"
    document.addEventListener('click', (e) => {
      const link = e.target.closest('a[data-spa="true"]');
      if (link) {
        e.preventDefault();
        const url = link.getAttribute('href');
        if (url) {
          this.navigate(url);
        }
      }
    });

    // Handle back/forward buttons
    window.addEventListener('popstate', () => {
      this.navigate(window.location.pathname, false);
    });

  }

  /**
   * Navigates to a new URL
   * @param {string} url - Target URL
   * @param {boolean} [updateHistory=true] - Whether to push state to history
   * @returns {Promise<void>}
   */
  async navigate(url, updateHistory = true) {
    const filePath = this._urlToFile(url);

    // Ensure container is available (could be null if init was called before DOM ready)
    if (!this.container) {
      this.container = document.getElementById('app-content');
    }

    if (!this.container) {
      console.warn('[BarcaRouter] No #app-content container found, falling back to full reload.');
      window.location.href = url;
      return;
    }

    barcaState.setState('loading');

    try {
      // 1. Get HTML (from cache or fetch)
      let html = barcaPrefetch.getCached(filePath);

      if (!html) {
        const response = await fetch(filePath);
        if (!response.ok) throw new Error(`Failed to fetch: ${response.status}`);
        html = await response.text();
      }

      // 2. Parse and Extract content
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      const newAppContent = doc.querySelector('#app-content');

      if (!newAppContent) {
        throw new Error('[BarcaRouter] #app-content not found in destination page');
      }

      const newHtml = newAppContent.innerHTML;
      const initFnName = newAppContent.dataset.init;

      // 3. Execute Transition and Swap
      // 3. Execute Transition and Swap
      // await this.transitions.fadeOut(this.container); // Disabled to prevent flickering


      // Update content and attributes
      this.container.innerHTML = newHtml;
      this.container.className = newAppContent.className;

      // Sync datasets (except init which we already extracted)
      Object.assign(this.container.dataset, newAppContent.dataset);

      await this.transitions.fadeIn(this.container);

      // 4. Update History
      if (updateHistory) {
        window.history.pushState({}, '', url);
      }

      // 5. Re-initialize Page Logic
      updateDateDisplay();
      if (initFnName && typeof window[initFnName] === 'function') {
        try {
          window[initFnName]();
        } catch (initError) {
          console.error(`[BarcaRouter] Error during page initialization (${initFnName}):`, initError);
        }
      }

      // 6. Scroll to top
      window.scrollTo(0, 0);

      barcaState.setState('idle');
    } catch (error) {
      console.error('[BarcaRouter] Navigation failed:', error);
      // Fallback: Full page reload
      if (updateHistory) {
        window.location.href = url;
      }
    }
  }

  /**
   * Maps a URL to a physical HTML file path
   * @param {string} url 
   * @returns {string}
   * @private
   */
  _urlToFile(url) {
    // Basic mapping based on user requirements
    if (url === '/' || url === '' || url.endsWith('/')) return '/index.html';

    // If it's already an .html file, return as is
    if (url.endsWith('.html')) return url;

    // Append .html if missing
    return url + '.html';
  }
}

// Export a single instance (Singleton)
export const barcaRouter = new BarcaRouter();
