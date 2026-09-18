/**
 * Centralized Financial Utility (moneyUtils)
 * Enforces integer paise calculations and strict 2-decimal rounding.
 */

export const moneyUtils = {
  /**
   * Converts Rupee amount to integer paise.
   * @param {number} rupees 
   * @returns {number} integer paise
   */
  toPaise(rupees) {
    if (typeof rupees !== 'number' || isNaN(rupees)) return 0;
    return Math.round(rupees * 100);
  },

  /**
   * Converts integer paise to decimal Rupees (2 decimal places).
   * @param {number} paise 
   * @returns {number} Rupees
   */
  fromPaise(paise) {
    if (typeof paise !== 'number' || isNaN(paise)) return 0;
    return Math.round(paise) / 100;
  },

  /**
   * Calculates percentage of an amount in Rupee scale using paise precision.
   * @param {number} amount In Rupees
   * @param {number} percentage Percentage (e.g. 5 for 5%)
   * @returns {number} Resulting amount in Rupees
   */
  calculatePercentage(amount, percentage) {
    if (!amount || !percentage || percentage <= 0) return 0;
    const amountPaise = this.toPaise(amount);
    const resultPaise = Math.round((amountPaise * percentage) / 100);
    return this.fromPaise(resultPaise);
  },

  /**
   * Safe financial addition.
   */
  addMoney(a, b) {
    return this.fromPaise(this.toPaise(a) + this.toPaise(b));
  },

  /**
   * Safe financial subtraction (never returns less than 0 if clampZero is true).
   */
  subtractMoney(a, b, clampZero = false) {
    const diff = this.toPaise(a) - this.toPaise(b);
    const result = this.fromPaise(diff);
    return clampZero ? Math.max(0, result) : result;
  },

  /**
   * Rounds a money value to standard 2 decimal places.
   */
  roundMoney(amount) {
    return this.fromPaise(this.toPaise(amount));
  }
};
