// Maps Prisma User + profile rows to the API-facing response shape,
// keeping that transformation out of the service.
export function toUserResponse(user: any) {
  return { id: user.id, email: user.email, role: user.role };
}
