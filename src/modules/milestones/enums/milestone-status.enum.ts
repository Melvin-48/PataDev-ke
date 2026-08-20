export enum MilestoneStatus {
  PENDING = 'PENDING',
  NOT_STARTED = 'NOT_STARTED',
  IN_PROGRESS = 'IN_PROGRESS',
  SUBMITTED = 'SUBMITTED',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
  ON_HOLD = 'ON_HOLD',
}

export const MilestoneStatusLabels = {
  [MilestoneStatus.PENDING]: 'Pending',
  [MilestoneStatus.NOT_STARTED]: 'Not Started',
  [MilestoneStatus.IN_PROGRESS]: 'In Progress',
  [MilestoneStatus.SUBMITTED]: 'Submitted for Review',
  [MilestoneStatus.APPROVED]: 'Approved',
  [MilestoneStatus.REJECTED]: 'Rejected',
  [MilestoneStatus.CANCELLED]: 'Cancelled',
  [MilestoneStatus.ON_HOLD]: 'On Hold',
};

export const MilestoneStatusColors = {
  [MilestoneStatus.PENDING]: '#FFA500',
  [MilestoneStatus.NOT_STARTED]: '#808080',
  [MilestoneStatus.IN_PROGRESS]: '#1E90FF',
  [MilestoneStatus.SUBMITTED]: '#9370DB',
  [MilestoneStatus.APPROVED]: '#32CD32',
  [MilestoneStatus.REJECTED]: '#FF4444',
  [MilestoneStatus.CANCELLED]: '#FF6B6B',
  [MilestoneStatus.ON_HOLD]: '#FFA07A',
};

// Allowed status transitions
export const MilestoneTransitions: Record<MilestoneStatus, MilestoneStatus[]> = {
  [MilestoneStatus.PENDING]: [MilestoneStatus.NOT_STARTED, MilestoneStatus.CANCELLED],
  [MilestoneStatus.NOT_STARTED]: [MilestoneStatus.IN_PROGRESS, MilestoneStatus.CANCELLED],
  [MilestoneStatus.IN_PROGRESS]: [MilestoneStatus.SUBMITTED, MilestoneStatus.ON_HOLD, MilestoneStatus.CANCELLED],
  [MilestoneStatus.SUBMITTED]: [MilestoneStatus.APPROVED, MilestoneStatus.REJECTED],
  [MilestoneStatus.APPROVED]: [],
  [MilestoneStatus.REJECTED]: [MilestoneStatus.IN_PROGRESS],
  [MilestoneStatus.CANCELLED]: [],
  [MilestoneStatus.ON_HOLD]: [MilestoneStatus.IN_PROGRESS, MilestoneStatus.CANCELLED],
};
