export const EVENTS = {
  BID_ACCEPTED: 'bid.accepted',
  MILESTONE_SUBMITTED: 'milestone.submitted',
  MILESTONE_APPROVED: 'milestone.approved',
  PAYOUT_COMPLETED: 'payout.completed',
} as const;

export type EventName = typeof EVENTS[keyof typeof EVENTS];
