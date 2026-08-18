// Documents which cross-module events Notifications listens for.
// Implement as NestJS EventEmitter listeners once the other modules emit these:
export const NOTIFICATION_TRIGGERS = [
  'bid.accepted',       // -> notify developer
  'milestone.approved', // -> notify developer
  'payout.completed',   // -> notify developer
];
