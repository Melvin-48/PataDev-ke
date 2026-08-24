import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { ClientProfile, DeveloperProfile, User, UserRole } from '@prisma/client';
import { RedisService } from '../../redis/service/redis.service';
import { UsersRepository } from '../repository/users.repository';
import { CreateClientProfileDto } from '../dto/create-client-profile.dto';
import { CreateDeveloperProfileDto } from '../dto/create-developer-profile.dto';
import { UpdateClientProfileDto } from '../dto/update-client-profile.dto';
import { UpdateDeveloperProfileDto } from '../dto/update-developer-profile.dto';
import { SyncUserDto } from '../dto/sync-user.dto';

type UserWithProfiles = User & {
  clientProfile: ClientProfile | null;
  developerProfile: DeveloperProfile | null;
};

const CACHE_TTL_SECONDS = 60;
const cacheKey = (supabaseId: string) => `user:${supabaseId}`;

@Injectable()
export class UsersService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly redis: RedisService,
  ) {}

  async syncFromSupabase(dto: SyncUserDto) {
    const existing = await this.usersRepository.findBySupabaseId(dto.supabaseId);
    if (existing) return existing;

    const user = await this.usersRepository.create({
      supabaseId: dto.supabaseId,
      email: dto.email,
      role: dto.role,
    });

    await this.redis.setJson(cacheKey(dto.supabaseId), user, CACHE_TTL_SECONDS);
    return user;
  }

  async findBySupabaseId(supabaseId: string): Promise<UserWithProfiles | null> {
    const cached = await this.redis.getJson<UserWithProfiles>(cacheKey(supabaseId));
    if (cached) return cached;

    const user = await this.usersRepository.findBySupabaseId(supabaseId);
    if (user) {
      await this.redis.setJson(cacheKey(supabaseId), user, CACHE_TTL_SECONDS);
    }
    return user;
  }

  async getById(id: string) {
    const user = await this.usersRepository.findById(id);
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async createClientProfile(userId: string, dto: CreateClientProfileDto) {
    const user = await this.getById(userId);
    if (user.role !== UserRole.CLIENT) {
      throw new ConflictException('User is not a CLIENT');
    }
    if (user.clientProfile) {
      throw new ConflictException('Client profile already exists');
    }

    const profile = await this.usersRepository.createClientProfile(userId, dto);
    await this.redis.invalidate(cacheKey(user.supabaseId));
    return profile;
  }

  async createDeveloperProfile(userId: string, dto: CreateDeveloperProfileDto) {
    const user = await this.getById(userId);
    if (user.role !== UserRole.DEVELOPER) {
      throw new ConflictException('User is not a DEVELOPER');
    }
    if (user.developerProfile) {
      throw new ConflictException('Developer profile already exists');
    }

    const profile = await this.usersRepository.createDeveloperProfile(userId, dto);
    await this.redis.invalidate(cacheKey(user.supabaseId));
    return profile;
  }

  async updateClientProfile(userId: string, dto: UpdateClientProfileDto) {
    const user = await this.getById(userId);
    if (user.role !== UserRole.CLIENT) {
      throw new ConflictException('User is not a CLIENT');
    }
    if (!user.clientProfile) {
      throw new NotFoundException('Client profile not found. Create a profile first.');
    }

    const profile = await this.usersRepository.updateClientProfile(userId, dto);
    await this.redis.invalidate(cacheKey(user.supabaseId));
    return profile;
  }

  async updateDeveloperProfile(userId: string, dto: UpdateDeveloperProfileDto) {
    const user = await this.getById(userId);
    if (user.role !== UserRole.DEVELOPER) {
      throw new ConflictException('User is not a DEVELOPER');
    }
    if (!user.developerProfile) {
      throw new NotFoundException('Developer profile not found. Create a profile first.');
    }

    const profile = await this.usersRepository.updateDeveloperProfile(userId, dto);
    await this.redis.invalidate(cacheKey(user.supabaseId));
    return profile;
  }
}

