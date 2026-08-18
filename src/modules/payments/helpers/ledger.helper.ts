// Tracks held vs. released balance per project. For MVP, the flow is:
// 1. Client payment recorded as a HELD ledger entry against the bid.
// 2. On milestone APPROVED, a COMMISSION entry + a PAYOUT entry are created (PENDING).
// 3. Admin manually confirms the payout (see PayoutConfirmationDto) - this
//    triggers the actual Stripe transfer / M-Pesa B2C call and flips status to COMPLETED.
// Full automated release is a post-MVP improvement once this flow is proven.
export const LEDGER_FLOW_NOTE = 'See comment above for the MVP-scoped payout flow.';
