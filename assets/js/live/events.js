/**
 * BarcaEvents - Event Dispatcher & Match Event Detector
 * Detects key match events (Goals, Starts, Ends) and notifies subscribers.
 */
class BarcaEvents {
    constructor() {
        if (BarcaEvents.instance) {
            return BarcaEvents.instance;
        }

        this.listeners = new Map();
        this.lastEvents = [];

        BarcaEvents.instance = this;
    }

    /**
     * Subscribes to a specific event type
     * @param {string} type - Event type (e.g., 'GOAL', 'MATCH_START')
     * @param {Function} callback - Callback function
     */
    on(type, callback) {
        if (!this.listeners.has(type)) {
            this.listeners.set(type, new Set());
        }
        this.listeners.get(type).add(callback);
    }

    /**
     * Emits an event to all subscribers
     * @param {string} type - Event type
     * @param {Object} payload - Event data
     */
    emit(type, payload) {
        const eventEntry = {
            type,
            payload,
            timestamp: Date.now()
        };

        // Keep last 10 events
        this.lastEvents.unshift(eventEntry);
        if (this.lastEvents.length > 10) {
            this.lastEvents.pop();
        }


        if (this.listeners.has(type)) {
            this.listeners.get(type).forEach(callback => {
                try {
                    callback(payload);
                } catch (error) {
                    console.error(`[BarcaEvents] Callback error for ${type}:`, error);
                }
            });
        }
    }

    /**
     * Detection logic for match-related events
     * @param {Object} oldMatch - Previous match data
     * @param {Object} newMatch - Current match data
     */
    checkForMatchEvents(oldMatch, newMatch) {
        if (!oldMatch || !newMatch) return;

        // 1. MATCH_START
        const liveStatuses = ['LIVE', 'IN_PLAY', 'PAUSED'];
        if (oldMatch.status === 'SCHEDULED' && liveStatuses.includes(newMatch.status)) {
            this.emit('MATCH_START', {
                match: newMatch,
                timestamp: new Date().toISOString()
            });
        }

        // 2. MATCH_END
        if (liveStatuses.includes(oldMatch.status) && newMatch.status === 'FINISHED') {
            this.emit('MATCH_END', {
                match: newMatch,
                timestamp: new Date().toISOString()
            });
        }

        // 3. GOAL
        const oldHome = oldMatch.homeScore ?? 0;
        const oldAway = oldMatch.awayScore ?? 0;
        const newHome = newMatch.homeScore ?? 0;
        const newAway = newMatch.awayScore ?? 0;

        if (newHome > oldHome || newAway > oldAway) {
            const scoringTeam = newHome > oldHome ? 'home' : 'away';
            this.emit('GOAL', {
                team: scoringTeam,
                score: { home: newHome, away: newAway },
                match: newMatch
            });
        }

        // 4. RED_CARD (Stub)
        // TODO: Implement when API provides card data
        // this.emit('RED_CARD', { team: 'unknown', minute: 0 });

        // 5. SUBSTITUTION (Stub)
        // TODO: Implement when API provides sub data
        // this.emit('SUBSTITUTION', { playerIn: '...', playerOut: '...' });
    }
}

export const barcaEvents = new BarcaEvents();
