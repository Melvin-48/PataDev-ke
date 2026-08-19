import type { User } from "@prisma/client";
import type { UserResponseDto } from "../dto/user-response.dto";

export function toUserResponse(
  user: Pick<User, "id" | "email" | "role">,
): UserResponseDto {
  return { id: user.id, email: user.email, role: user.role };
}
