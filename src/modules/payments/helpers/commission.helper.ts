// Calculates the platform's cut. Developer chooses one of two models at
// listing time (see DeveloperProfile.listingTier) - this only implements
// the percentage-commission path; the flat monthly listing fee is billed
// separately via a subscription flow, not per-transaction.
const COMMISSION_RATE = 0.1; // placeholder - confirm actual % with the team

export function calculateCommission(amount: number): number {
  return Math.round(amount * COMMISSION_RATE * 100) / 100;
}
