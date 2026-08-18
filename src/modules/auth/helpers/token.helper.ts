// Small helpers for token-related formatting, kept separate from AuthService
// so the service stays focused on orchestration, not string manipulation.
export function stripBearerPrefix(header: string): string {
  return header?.replace('Bearer ', '') ?? '';
}
