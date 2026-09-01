import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { ClientProfile, DeveloperProfile, User, UserRole } from '@prisma/client';
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

@Injectable()
export class UsersService {
  constructor(
    private readonly usersRepository: UsersRepository,
  ) {}

  async syncFromSupabase(dto: SyncUserDto) {
    const existing = await this.usersRepository.findBySupabaseId(dto.supabaseId);
    if (existing) return existing;

    const existingByEmail = await this.usersRepository.findByEmail(dto.email);
    if (existingByEmail) {
      return this.usersRepository.updateSupabaseId(existingByEmail.id, dto.supabaseId);
    }

    return this.usersRepository.create({
      supabaseId: dto.supabaseId,
      email: dto.email,
      role: dto.role,
    });
  }

  async findBySupabaseId(supabaseId: string): Promise<UserWithProfiles | null> {
    return this.usersRepository.findBySupabaseId(supabaseId);
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

    return this.usersRepository.createClientProfile(userId, dto);
  }

  async createDeveloperProfile(userId: string, dto: CreateDeveloperProfileDto) {
    const user = await this.getById(userId);
    if (user.role !== UserRole.DEVELOPER) {
      throw new ConflictException('User is not a DEVELOPER');
    }
    if (user.developerProfile) {
      throw new ConflictException('Developer profile already exists');
    }

    return this.usersRepository.createDeveloperProfile(userId, dto);
  }

  async updateClientProfile(userId: string, dto: UpdateClientProfileDto) {
    const user = await this.getById(userId);
    if (user.role !== UserRole.CLIENT) {
      throw new ConflictException('User is not a CLIENT');
    }
    if (!user.clientProfile) {
      throw new NotFoundException('Client profile not found. Create a profile first.');
    }

    return this.usersRepository.updateClientProfile(userId, dto);
  }

  async updateDeveloperProfile(userId: string, dto: UpdateDeveloperProfileDto) {
    const user = await this.getById(userId);
    if (user.role !== UserRole.DEVELOPER) {
      throw new ConflictException('User is not a DEVELOPER');
    }
    if (!user.developerProfile) {
      throw new NotFoundException('Developer profile not found. Create a profile first.');
    }

    return this.usersRepository.updateDeveloperProfile(userId, dto);
  }
}
