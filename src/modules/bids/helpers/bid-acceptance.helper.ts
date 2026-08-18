// Accepting one bid on a project should auto-close every other pending bid
// on that same project - this documents that rule so it isn't reinvented
// differently inside the service later.
export const BID_ACCEPTANCE_RULE =
  'Accepting a bid sets it to ACCEPTED and every other PENDING bid on the same project to REJECTED.';
