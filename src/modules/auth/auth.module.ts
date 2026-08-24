import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './controller/auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { SupabaseVerifiedStrategy } from './strategies/supabase-verified.strategy';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [PassportModule, UsersModule],
  controllers: [AuthController],
  providers: [JwtStrategy, SupabaseVerifiedStrategy],
  exports: [],
})
export class AuthModule {}


