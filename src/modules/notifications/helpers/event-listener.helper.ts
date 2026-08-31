import { EVENTS } from '../../../common/events/event-names';

// Canonical cross-module events handled by NotificationsListener:
export const NOTIFICATION_TRIGGERS = [
  EVENTS.BID_ACCEPTED,       // -> notify developer
  EVENTS.MILESTONE_SUBMITTED, // -> notify client
  EVENTS.MILESTONE_APPROVED,  // -> notify developer
  EVENTS.PAYOUT_COMPLETED,    // -> notify developer
];

export { EVENTS };
