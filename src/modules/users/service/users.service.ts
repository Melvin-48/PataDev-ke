import { Injectable } from '@nestjs/common';
import { UsersRepository } from '../repository/users.repository';
import { CreateClientProfileDto } from '../dto/create-client-profile.dto';
import { CreateDeveloperProfileDto } from '../dto/create-developer-profile.dto';

@Injectable()
export class UsersService {
  constructor(private usersRepository: UsersRepository) {}

  getById(id: string) {
    return this.usersRepository.findById(id);
  }

  createClientProfile(userId: string, dto: CreateClientProfileDto) {
    // TODO: create ClientProfile row via Prisma
    throw new Error('Not implemented');
  }

  createDeveloperProfile(userId: string, dto: CreateDeveloperProfileDto) {
    // TODO: create DeveloperProfile row via Prisma
    throw new Error('Not implemented');
  }
}
