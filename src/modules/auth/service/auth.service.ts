import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { SignUpDto } from '../dto/sign-up.dto';
import { SignInDto } from '../dto/sign-in.dto';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  async signUp(dto: SignUpDto) {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new BadRequestException('Supabase environment variables are missing');
    }

    // 1. Call Supabase Auth sign-up endpoint
    const response = await fetch(`${supabaseUrl}/auth/v1/signup`, {
      method: 'POST',
      headers: {
        'apikey': supabaseAnonKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: dto.email,
        password: dto.password,
        data: {
          role: dto.role, // sets custom metadata
        },
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new BadRequestException(data.error_description || data.message || 'Supabase sign-up failed');
    }

    const supabaseUser = data.user;
    if (!supabaseUser) {
      throw new BadRequestException('Sign-up succeeded but no user details returned');
    }

    // 2. Mirror the user in the local database
    // Set local User.id to the Supabase User UUID to align JWT payload.sub with relations
    const localUser = await this.prisma.user.create({
      data: {
        id: supabaseUser.id,
        supabaseId: supabaseUser.id,
        email: dto.email,
        role: dto.role,
      },
    });

    return {
      accessToken: data.session?.access_token || '',
      userId: localUser.id,
      role: localUser.role,
    };
  }

  async signIn(dto: SignInDto) {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new BadRequestException('Supabase environment variables are missing');
    }

    // 1. Call Supabase Auth sign-in endpoint (grant_type=password)
    const response = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: {
        'apikey': supabaseAnonKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: dto.email,
        password: dto.password,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new UnauthorizedException(data.error_description || data.message || 'Supabase sign-in failed');
    }

    const supabaseUser = data.user;
    if (!supabaseUser) {
      throw new BadRequestException('Sign-in succeeded but no user details returned');
    }

    // 2. Query local user to get their role and primary key
    const localUser = await this.prisma.user.findUnique({
      where: { supabaseId: supabaseUser.id },
    });

    if (!localUser) {
      throw new UnauthorizedException('User authenticated in Supabase but not registered locally');
    }

    return {
      accessToken: data.access_token,
      userId: localUser.id,
      role: localUser.role,
    };
  }
}
