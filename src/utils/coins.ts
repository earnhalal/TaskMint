/**
 * Coins — the display unit for earnings (owner's gamification call,
 * 2026-10-25): small rupee amounts like Rs. 0.30 look tiny and do not
 * hold users; coins make progress feel real (30 coins per ad).
 *
 * Coins are a DISPLAY unit only. All accounting — balances, ledgers,
 * withdrawals — stays in rupees exactly as before. The rate is fixed:
 * 100 coins = Rs. 1, and surfaces that show coins also show the rupee
 * value alongside, so the display can never mislead.
 */
export const COINS_PER_RUPEE = 100;

/** Rupees → whole coins (Rs. 0.30 → 30, Rs. 10,660.30 → 1,066,030). */
export function rsToCoins(rs: number): number {
  return Math.round((rs || 0) * COINS_PER_RUPEE);
}

/** "1,066,030" style coin count for a rupee amount. */
export function coinsCount(rs: number): string {
  return rsToCoins(rs).toLocaleString('en-US');
}

/** "30 Gold Coins" label for a rupee amount. */
export function coinsLabel(rs: number): string {
  return `${coinsCount(rs)} Gold Coins`;
}

/** Minimum conversion: 100 Gold Coins (= Rs. 1). */
export const MIN_CONVERT_COINS = 100;

/** Gold Coins → rupees (100 coins = Rs. 1). */
export function coinsToRs(coins: number): number {
  return Math.floor(coins) / COINS_PER_RUPEE;
}
