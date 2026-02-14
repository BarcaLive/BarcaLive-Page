/**
 * BarcaSync - Data Synchronization & Change Detection
 * Detects granular changes in match data and triggers targeted UI updates.
 */
class BarcaSync {
    constructor() {
        if (BarcaSync.instance) {
            return BarcaSync.instance;
        }

        this.previousMatch = null;
        this.detectors = new Map();

        // Register default detectors
        this.registerDetector('matchStatus', (old, current) => this._handleStatusChange(old, current));

        BarcaSync.instance = this;
    }

    /**
     * Internal handler for match status changes.
     * Detects when a match moves from a live state to a finished state.
     * @param {Object} oldMatch
     * @param {Object} newMatch
     * @private
     */
    _handleStatusChange(oldMatch, newMatch) {
        if (!oldMatch || !newMatch) return;

        const liveStatuses = ['LIVE', '1H', '2H', 'HT', 'ET', 'P', 'IN_PLAY', 'PAUSED'];
        const finishedStatuses = ['FT', 'FINISHED', 'AET'];

        const wasLive = liveStatuses.includes(oldMatch.status);
        const isFinished = finishedStatuses.includes(newMatch.status);

        if (wasLive && isFinished) {
            console.log(`[BarcaSync] Match end detected: ${oldMatch.status} -> ${newMatch.status}`);
            this._notifyWorker(newMatch);

            // Trigger a manual sync to Supabase to ensure final data is saved
            if (window.barcaAPI) {
                window.barcaAPI.fetchAllData(true);
            }
        }
    }

    /**
     * Sends a notification to the Cloudflare Worker.
     * Uses localStorage to ensure only one notification is sent per match.
     * @param {Object} match
     * @private
     */
    async _notifyWorker(match) {
        const matchId = match.id || 'current';
        const storageKey = `match_end_notified_${matchId}`;

        if (localStorage.getItem(storageKey)) {
            return;
        }

        try {
            // Strategy: Use a Cloudflare Pages Function to notify the worker.
            // Access is now managed via Supabase RLS and direct worker communication.
            const response = await fetch(`/api/sync-notify?matchId=${matchId}`);

            if (response.ok) {
                console.log(`[BarcaSync] Successfully notified worker for match ${matchId}`);
                localStorage.setItem(storageKey, 'true');
            } else {
                console.error(`[BarcaSync] Worker notification failed with status: ${response.status}`);
            }
        } catch (error) {
            console.error('[BarcaSync] Error notifying worker:', error);
        }
    }

    /**
     * Registers a new change detector
     * @param {string} key - Unique identifier for the detector
     * @param {Function} detectorFn - Function (oldMatch, newMatch) => void
     */
    registerDetector(key, detectorFn) {
        this.detectors.set(key, detectorFn);
    }

    /**
     * Compares new match data with previous state and triggers detectors
     * @param {Object} currentMatch - New match data object
     */
    process(currentMatch) {
        if (!currentMatch) return;

        if (!this.previousMatch) {
            this.previousMatch = JSON.parse(JSON.stringify(currentMatch));
            return;
        }

        this.detectChanges(this.previousMatch, currentMatch);
        this.previousMatch = JSON.parse(JSON.stringify(currentMatch));
    }

    /**
     * Executes all registered detectors
     * @param {Object} oldData
     * @param {Object} newData
     */
    detectChanges(oldData, newData) {
        this.detectors.forEach((fn, key) => {
            try {
                fn(oldData, newData);
            } catch (error) {
                console.error(`[BarcaSync] Detector error [${key}]:`, error);
            }
        });
    }

    /**
     * Utility to apply a visual pulse effect to an element
     * @param {HTMLElement|string} element - Element or ID
     */
    applyPulseEffect(element) {
        const el = typeof element === 'string' ? document.getElementById(element) : element;
        if (!el) return;

        el.classList.add('pulse-update');

        // Ensure the class is removed after the animation completes
        const removeClass = () => {
            el.classList.remove('pulse-update');
            el.removeEventListener('animationend', removeClass);
        };

        el.addEventListener('animationend', removeClass);

        // Fallback if animationend doesn't fire
        setTimeout(() => el.classList.remove('pulse-update'), 3000);
    }
}

export const barcaSync = new BarcaSync();
