const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  PENDING: ['IN_PROGRESS'],
  IN_PROGRESS: ['SUBMITTED'],
  SUBMITTED: ['APPROVED', 'IN_PROGRESS'], // client can send back for revision
  APPROVED: [], // approval is what should trigger the Payments module payout
};

export function canTransition(from: string, to: string): boolean {
  return ALLOWED_TRANSITIONS[from]?.includes(to) ?? false;
}
