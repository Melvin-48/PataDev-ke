// Accepting one bid on a project should auto-close every other pending bid
// on that same project - this documents that rule so it isn't reinvented
// differently inside the service later. The implementation lives in
// BidsRepository.acceptAndMatch, which runs it atomically with the project
// moving to MATCHED. Declining a bid only touches that one bid (REJECTED);
// it never re-opens the round.
export const BID_ACCEPTANCE_RULE =
  'Accepting a bid sets it to ACCEPTED and every other PENDING bid on the same project to REJECTED.';
