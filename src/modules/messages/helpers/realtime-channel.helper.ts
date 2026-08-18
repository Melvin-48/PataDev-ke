// The Supabase Realtime channel for a conversation is derived directly from
// the accepted bid's id, so access naturally narrows to the matched pair
// without a separate permissions table.
export function channelForBid(bidId: string): string {
  return `bid:${bidId}:messages`;
}
