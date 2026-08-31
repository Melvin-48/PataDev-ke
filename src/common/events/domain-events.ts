export class BidAcceptedEvent {
  constructor(
    public bidId: string,
    public projectId: string,
    public developerId: string,
    public clientId: string,
  ) {}
}

export class MilestoneSubmittedEvent {
  constructor(
    public milestoneId: string,
    public bidId: string,
    public clientId: string,
  ) {}
}

export class MilestoneApprovedEvent {
  constructor(
    public milestoneId: string,
    public bidId: string,
    public developerId: string,
  ) {}
}

export class PayoutCompletedEvent {
  constructor(
    public paymentId: string,
    public bidId: string,
    public developerId: string,
    public amount: number,
  ) {}
}
