import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { UsersService } from '../service/users.service';
import { CreateClientProfileDto } from '../dto/create-client-profile.dto';
import { CreateDeveloperProfileDto } from '../dto/create-developer-profile.dto';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  me(@Req() req: any) {
    return this.usersService.findBySupabaseId(req.user.sub);
  }

  @Post('me/client-profile')
  completeMyClientProfile(@Req() req: any, @Body() dto: CreateClientProfileDto) {
    return this.usersService.createClientProfile(req.user.localUserId, dto);
  }

  @Post('me/developer-profile')
  completeMyDeveloperProfile(@Req() req: any, @Body() dto: CreateDeveloperProfileDto) {
    return this.usersService.createDeveloperProfile(req.user.localUserId, dto);
  }

  @Get(':id')
  getById(@Param('id') id: string) {
    return this.usersService.getById(id);
  }

  @Post(':id/client-profile')
  createClientProfile(@Param('id') id: string, @Body() dto: CreateClientProfileDto) {
    return this.usersService.createClientProfile(id, dto);
  }

  @Post(':id/developer-profile')
  createDeveloperProfile(@Param('id') id: string, @Body() dto: CreateDeveloperProfileDto) {
    return this.usersService.createDeveloperProfile(id, dto);
  }
}
