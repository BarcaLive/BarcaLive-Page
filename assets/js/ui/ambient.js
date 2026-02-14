import { barcaEvents } from '../live/events.js';

/**
 * BarcaAmbient - Ambient Lighting & Visual Effects Engine
 * Synchronizes the UI with match events using the mesh background.
 */
class BarcaAmbient {
  constructor() {
    if (BarcaAmbient.instance) {
      return BarcaAmbient.instance;
    }

    /** @private */
    this.meshEl = null;
    /** @private */
    this.colors = {
      default: '#1a1a2e',
      barcaGoal: '#00D9FF',
      opponentGoal: '#FF4444',
      redCard: '#CC0000',
      livePulse: '#FFD700'
    };

    BarcaAmbient.instance = this;
  }

  /**
   * Initializes the ambient engine and subscribes to events.
   */
  init() {
    this.meshEl = document.querySelector('.mesh-background');

    // Subscribe to match events
    barcaEvents.on('GOAL', (data) => this.onGoal(data));
    barcaEvents.on('MATCH_START', () => this.setEffect('livePulse', 5000));
    barcaEvents.on('MATCH_END', () => this.resetEffect());
    barcaEvents.on('RED_CARD', () => this.setEffect('redCard', 10000));

  }

  /**
   * Handles goal events
   * @param {Object} data - Goal event data
   */
  onGoal(data) {
    const BARCA_ID = 81;
    const match = data.match;
    let isBarca = false;

    if (match) {
      if (data.team === 'home' && match.homeTeam.id === BARCA_ID) isBarca = true;
      if (data.team === 'away' && match.awayTeam.id === BARCA_ID) isBarca = true;
    } else {
      // Fallback for manual testing if match data is missing
      isBarca = data.team === 'home' || data.isBarca;
    }

    const effect = isBarca ? 'barcaGoal' : 'opponentGoal';
    this.setEffect(effect, 8000);
  }

  /**
   * Sets a visual effect by changing CSS variables
   * @param {string} type - Effect type
   * @param {number} [duration=5000] - Duration in ms before resetting
   */
  setEffect(type, duration = 5000) {
    if (!this.meshEl) this.meshEl = document.querySelector('.mesh-background');
    if (!this.meshEl) return;

    const color = this.colors[type] || this.colors.default;
    document.documentElement.style.setProperty('--mesh-color-1', color);


    if (type !== 'default') {
      if (this.resetTimeout) clearTimeout(this.resetTimeout);
      this.resetTimeout = setTimeout(() => this.resetEffect(), duration);
    }
  }

  /**
   * Resets the ambient background to default state
   */
  resetEffect() {
    document.documentElement.style.setProperty('--mesh-color-1', this.colors.default);
  }
}

export const barcaAmbient = new BarcaAmbient();
