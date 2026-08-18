import { Module } from '@nestjs/common';
import { MilestonesController } from './controller/milestones.controller';
import { MilestonesService } from './service/milestones.service';
import { MilestonesRepository } from './repository/milestones.repository';

@Module({
  controllers: [MilestonesController],
  providers: [MilestonesService, MilestonesRepository],
  exports: [MilestonesService],
})
export class MilestonesModule {}
