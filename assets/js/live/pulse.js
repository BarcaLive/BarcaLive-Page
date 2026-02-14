import { barcaAPI } from '../core/api.js';
import { barcaState } from '../core/state.js';

/**
 * BarcaPulse - Smart Polling System
 * Manages real-time data updates with respect to API limits and user activity.
 */
class BarcaPulse {
    constructor() {
        if (BarcaPulse.instance) {
            return BarcaPulse.instance;
        }

        this.subscribers = new Set();
        this.intervalId = null;
        this.lastActivity = Date.now();
        this.errorCount = 0;
        this.isPolling = false;

        this.INACTIVITY_THRESHOLD = 120000; // 2 minutes
        this.MODES = {
            live: 30000,
            active: 120000,
            idle: 300000,
            cooldown: 600000 // 10 minutes on consecutive errors
        };

        this._setupActivityListeners();
        BarcaPulse.instance = this;
    }

    /**
     * Starts the polling system
     */
    start() {
        if (this.intervalId) return;
        this.tick();
    }

    /**
     * Stops the polling system
     */
    stop() {
        if (this.intervalId) {
            clearTimeout(this.intervalId);
            this.intervalId = null;
        }
    }

    /**
     * Core polling logic
     */
    async tick() {
        this.isPolling = true;

        try {
            const result = await barcaAPI.fetchTeamMatches(true);

            if (result.success) {
                this.errorCount = 0;
                // Flatten matches for subscribers who expect an array
                const flatMatches = [
                    ...(result.data.matches.live || []),
                    ...(result.data.matches.upcoming || []),
                    ...(result.data.matches.finished || [])
                ];
                this.notify(flatMatches);
                this._scheduleNext(this._getCurrentInterval());
            } else {
                this._handleError(result.error);
            }
        } catch (error) {
            this._handleError(error.message);
        } finally {
            this.isPolling = false;
        }
    }

    /**
     * Determines the next interval based on state and activity
     * @private
     */
    _getCurrentInterval() {
        const now = Date.now();
        const userActive = (now - this.lastActivity) < this.INACTIVITY_THRESHOLD;

        if (this.errorCount >= 3) {
            console.warn('[BarcaPulse] Entering error cooldown (10m)');
            return this.MODES.cooldown;
        }

        if (barcaState.getState() === 'live') {
            return this.MODES.live;
        }

        return userActive ? this.MODES.active : this.MODES.idle;
    }

    /**
     * Schedules the next tick
     * @private
     */
    _scheduleNext(ms) {
        if (this.intervalId) clearTimeout(this.intervalId);
        this.intervalId = setTimeout(() => this.tick(), ms);

        const mode = Object.keys(this.MODES).find(key => this.MODES[key] === ms) || 'custom';
    }

    /**
     * Handles API or network errors
     * @private
     */
    _handleError(error) {
        const errorMsg = error || 'Unknown Error';
        if (errorMsg === 'Rate limit') {
            console.warn('[BarcaPulse] Rate limit hit, backing off to idle');
            this._scheduleNext(this.MODES.idle);
            return;
        }

        this.errorCount++;
        console.error(`[BarcaPulse] Error (${this.errorCount}/3):`, errorMsg);

        if (this.errorCount >= 3) {
            this._scheduleNext(this.MODES.cooldown);
        } else {
            this._scheduleNext(this.MODES.active); // Try again sooner
        }
    }

    /**
     * Subscribes a callback to match data updates
     * @param {Function} callback
     */
    subscribe(callback) {
        this.subscribers.add(callback);
        return () => this.subscribers.delete(callback);
    }

    /**
     * Notifies all subscribers with new data
     * @private
     */
    notify(data) {
        this.subscribers.forEach(cb => cb(data));
    }

    /**
     * Updates activity timestamp
     * @private
     */
    _setupActivityListeners() {
        const updateActivity = () => {
            const wasInactive = (Date.now() - this.lastActivity) >= this.INACTIVITY_THRESHOLD;
            this.lastActivity = Date.now();

            // If we were inactive and just became active, trigger a tick if not currently polling
            if (wasInactive && !this.isPolling && barcaState.getState() !== 'live') {
                this.tick();
            }
        };

        if (typeof window !== 'undefined') {
            ['mousemove', 'keydown', 'scroll', 'click'].forEach(event => {
                window.addEventListener(event, updateActivity, { passive: true });
            });
        }
    }
}

export const barcaPulse = new BarcaPulse();
