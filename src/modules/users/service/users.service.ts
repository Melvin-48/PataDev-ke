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
    return this.usersRepository.createClientProfile(userId, dto);
  }

  createDeveloperProfile(userId: string, dto: CreateDeveloperProfileDto) {
    return this.usersRepository.createDeveloperProfile(userId, dto);
  }
}
