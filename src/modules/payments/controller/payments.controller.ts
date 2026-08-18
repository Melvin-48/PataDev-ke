import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { AdminOnlyGuard } from '../guards/admin-only.guard';
import { PaymentsService } from '../service/payments.service';
import { InitiatePaymentDto } from '../dto/initiate-payment.dto';
import { PayoutConfirmationDto } from '../dto/payout-confirmation.dto';

@ApiTags('payments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('initiate')
  initiate(@Body() dto: InitiatePaymentDto) {
    return this.paymentsService.initiate(dto);
  }

  @Post('confirm-payout')
  @UseGuards(AdminOnlyGuard)
  confirmPayout(@Body() dto: PayoutConfirmationDto) {
    // TODO: look up bidId + amount from the milestone before calling service
    return this.paymentsService.confirmPayout(dto.milestoneId, 'TODO-bidId', 0);
  }

  @Get('bid/:bidId')
  history(@Param('bidId') bidId: string) {
    return this.paymentsService.history(bidId);
  }
}
