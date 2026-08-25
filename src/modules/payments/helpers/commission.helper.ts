// Calculates the platform's cut. The actual rate is read from the
// PlatformSetting table at runtime (see PaymentsService) and passed in;
// the default 0.1 here is a safety fallback only.
export function calculateCommission(amount: number, rate: number = 0.1): number {
  return Math.round(amount * rate * 100) / 100;
}
