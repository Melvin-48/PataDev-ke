import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { AdminOnlyGuard } from '../guards/admin-only.guard';
import { PaymentsService } from '../service/payments.service';
import { InitiatePaymentDto } from '../dto/initiate-payment.dto';
import { PayoutConfirmationDto } from '../dto/payout-confirmation.dto';

@ApiTags('payments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('initiate')
  @Roles('CLIENT')
  initiate(@Body() dto: InitiatePaymentDto) {
    return this.paymentsService.initiate(dto);
  }

  @Post('confirm-payout')
  @UseGuards(AdminOnlyGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  confirmPayout(@Body() dto: PayoutConfirmationDto) {
    return this.paymentsService.confirmPayout(dto.milestoneId);
  }

  @Get('bid/:bidId')
  history(@Param('bidId') bidId: string) {
    return this.paymentsService.history(bidId);
  }
}
