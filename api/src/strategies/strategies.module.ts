import { Module } from '@nestjs/common';
import { StrategyService } from './strategy.service';
import { ApprovalsModule } from '../approvals/approvals.module';
import { ModelsModule } from '../models/models.module';

@Module({
  imports: [ApprovalsModule, ModelsModule],
  providers: [StrategyService],
  exports: [StrategyService],
})
export class StrategiesModule {}
