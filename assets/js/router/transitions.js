import { barcaAnimations } from '../ui/animations.js';

/**
 * Transitions Engine for BarcaLive SPA
 * Handles smooth fade-in and fade-out animations during navigation.
 */
export class BarcaTransitions {
  constructor() {
    /** @private */
    this.duration = 200; // ms
  }

  /**
   * Fades out the specified element
   * @param {HTMLElement} element - The element to fade out
   * @returns {Promise<void>}
   */
  async fadeOut(element) {
    if (!element) return;
    return barcaAnimations.fadeOut(element, this.duration);
  }

  /**
   * Fades in the specified element
   * @param {HTMLElement} element - The element to fade in
   * @returns {Promise<void>}
   */
  async fadeIn(element) {
    if (!element) return;
    return barcaAnimations.fadeIn(element, this.duration);
  }

  /**
   * Orchestrates a sequential content swap with transitions
   * @param {HTMLElement} container - The container element to swap content in
   * @param {string} newHtml - The new HTML content
   * @returns {Promise<void>}
   */
  async swap(container, newHtml) {
    try {
      await this.fadeOut(container);
      container.innerHTML = newHtml;
      await this.fadeIn(container);
    } catch (error) {
      console.error('[BarcaTransitions] Error during content swap:', error);
      container.innerHTML = newHtml; // Fallback to immediate swap
    }
  }
}
