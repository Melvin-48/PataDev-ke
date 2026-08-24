// State machine for Project.status - keeps illegal transitions out of the service.
// MATCHED projects cannot be cancelled for now: doing so would strand the
// accepted bid (and eventually funded milestones) with no cascade story yet.
// Revisit when refunds/cancellation flows exist.
const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  DRAFT: ['OPEN', 'CANCELLED'],
  OPEN: ['MATCHED', 'CANCELLED'],
  MATCHED: ['COMPLETED'],
  COMPLETED: [],
  CANCELLED: [],
};

export function canTransition(from: string, to: string): boolean {
  return ALLOWED_TRANSITIONS[from]?.includes(to) ?? false;
}
