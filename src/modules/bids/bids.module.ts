import { Module } from '@nestjs/common';
import { BidsController } from './controller/bids.controller';
import { BidsService } from './service/bids.service';
import { BidsRepository } from './repository/bids.repository';

@Module({
  controllers: [BidsController],
  providers: [BidsService, BidsRepository],
  exports: [BidsService],
})
export class BidsModule {}
