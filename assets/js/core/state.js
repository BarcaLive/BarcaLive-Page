/**
 * Observable State Management for BarcaLive
 * Singleton pattern (Class-based)
 */
class BarcaState {
  constructor() {
    if (BarcaState.instance) {
      return BarcaState.instance;
    }

    this._state = 'idle'; // 'idle', 'loading', 'live', 'error', 'offline'
    this._listeners = new Set();

    this._initNetworkListeners();
    BarcaState.instance = this;
  }

  /**
   * Returns the current application state
   * @returns {string} 'idle' | 'loading' | 'live' | 'error' | 'offline'
   */
  getState() {
    return this._state;
  }

  /**
   * Updates the application state and notifies all subscribers
   * @param {string} newState - The new state to set
   */
  setState(newState) {
    if (this._state === newState) return;

    const validStates = ['idle', 'loading', 'live', 'error', 'offline'];
    if (!validStates.includes(newState)) {
      console.warn(`[BarcaState] Invalid state attempted: ${newState}`);
      return;
    }

    this._state = newState;
    this._notify();
  }

  /**
   * Subscribes a callback function to state changes
   * @param {Function} callbackFn - Function to call on state change
   * @returns {Function} Unsubscribe function
   */
  subscribe(callbackFn) {
    this._listeners.add(callbackFn);
    // Initial call with current state
    callbackFn(this._state);
    return () => this._listeners.delete(callbackFn);
  }

  /**
   * Checks if the application is currently in 'live' mode
   * @returns {boolean}
   */
  isLive() {
    return this._state === 'live';
  }

  /**
   * Notifies all registered subscribers of a state change
   * @private
   */
  _notify() {
    this._listeners.forEach(callback => {
      try {
        callback(this._state);
      } catch (error) {
        console.error('[BarcaState] Error in subscriber callback:', error);
      }
    });
  }

  /**
   * Initializes browser event listeners for network connectivity
   * @private
   */
  _initNetworkListeners() {
    if (typeof window === 'undefined') return;

    window.addEventListener('online', () => {
      if (this._state === 'offline') {
        this.setState('idle');
      }
    });

    window.addEventListener('offline', () => {
      this.setState('offline');
    });

    // Set initial state if offline
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      this._state = 'offline';
    }
  }
}

// Export a single instance (Singleton)
export const barcaState = new BarcaState();
