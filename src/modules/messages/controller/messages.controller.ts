import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { BidAcceptedGuard } from '../guards/bid-accepted.guard';
import { MessagesService } from '../service/messages.service';
import { SendMessageDto } from '../dto/send-message.dto';

@ApiTags('messages')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  // Chat list for either role - every ACCEPTED engagement the current user is
  // part of (as the client or as the winning developer), with the counterpart
  // name and latest message for previews. Not gated by BidAcceptedGuard since
  // there is no single bid being acted on here.
  @Get('conversations')
  conversations(@CurrentUser() user) {
    return this.messagesService.conversations(user.id);
  }

  @Post()
  @UseGuards(BidAcceptedGuard)
  async send(@CurrentUser() user, @Body() dto: SendMessageDto) {
    const saved = await this.messagesService.send(user.id, dto.bidId, dto.content);
    await this.messagesService.autoReply(user.id, dto.bidId);
    return saved;
  }

  @Get('bid/:bidId')
  @UseGuards(BidAcceptedGuard)
  history(@Param('bidId') bidId: string) {
    return this.messagesService.history(bidId);
  }
}
