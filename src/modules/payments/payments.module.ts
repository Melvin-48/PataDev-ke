import { Module } from '@nestjs/common';
import { PaymentsController } from './controller/payments.controller';
import { PaymentsService } from './service/payments.service';
import { PaymentsRepository } from './repository/payments.repository';

@Module({
  controllers: [PaymentsController],
  providers: [PaymentsService, PaymentsRepository],
  exports: [PaymentsService],
})
export class PaymentsModule {}
