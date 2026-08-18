import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { BidAcceptedGuard } from '../guards/bid-accepted.guard';
import { MessagesService } from '../service/messages.service';
import { SendMessageDto } from '../dto/send-message.dto';

@ApiTags('messages')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, BidAcceptedGuard)
@Controller('messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Post()
  send(@CurrentUser() user, @Body() dto: SendMessageDto) {
    return this.messagesService.send(user.id, dto.bidId, dto.content);
  }

  @Get('bid/:bidId')
  history(@Param('bidId') bidId: string) {
    return this.messagesService.history(bidId);
  }
}
