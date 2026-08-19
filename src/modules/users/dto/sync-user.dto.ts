import { IsEmail, IsEnum, IsUUID } from "class-validator";
import { UserRole } from "@prisma/client";

export class SyncUserDto {
  @IsUUID()
  supabaseId!: string;

  @IsEmail()
  email!: string;

  @IsEnum(UserRole)
  role!: UserRole;
}
