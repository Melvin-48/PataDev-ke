import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { ProfileOwnershipGuard } from '../guards/profile-ownership.guard';
import { UsersService } from '../service/users.service';
import { CreateClientProfileDto } from '../dto/create-client-profile.dto';
import { CreateDeveloperProfileDto } from '../dto/create-developer-profile.dto';
import { UpdateClientProfileDto } from '../dto/update-client-profile.dto';
import { UpdateDeveloperProfileDto } from '../dto/update-developer-profile.dto';
import { toUserResponse } from '../helpers/profile.mapper';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  async me(@Req() req: any) {
    const user = await this.usersService.findBySupabaseId(req.user.sub);
    return user ? toUserResponse(user) : null;
  }

  @Post('me/client-profile')
  @Roles(UserRole.CLIENT)
  async completeMyClientProfile(
    @Req() req: any,
    @Body() dto: CreateClientProfileDto,
  ) {
    const profile = await this.usersService.createClientProfile(
      req.user.localUserId,
      dto,
    );
    return profile;
  }

  @Patch('me/client-profile')
  @Roles(UserRole.CLIENT)
  async updateMyClientProfile(
    @Req() req: any,
    @Body() dto: UpdateClientProfileDto,
  ) {
    return this.usersService.updateClientProfile(req.user.localUserId, dto);
  }

  @Post('me/developer-profile')
  @Roles(UserRole.DEVELOPER)
  async completeMyDeveloperProfile(
    @Req() req: any,
    @Body() dto: CreateDeveloperProfileDto,
  ) {
    const profile = await this.usersService.createDeveloperProfile(
      req.user.localUserId,
      dto,
    );
    return profile;
  }

  @Patch('me/developer-profile')
  @Roles(UserRole.DEVELOPER)
  async updateMyDeveloperProfile(
    @Req() req: any,
    @Body() dto: UpdateDeveloperProfileDto,
  ) {
    return this.usersService.updateDeveloperProfile(req.user.localUserId, dto);
  }

  @Get(':userId')
  @UseGuards(ProfileOwnershipGuard)
  async getById(@Param('userId') userId: string) {
    const user = await this.usersService.getById(userId);
    return toUserResponse(user);
  }
}

