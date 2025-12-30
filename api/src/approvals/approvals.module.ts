import { Module } from '@nestjs/common';
import { ApprovalsService } from './approvals.service';
import { ApprovalService } from './approval.service';
import { ApprovalsController } from './approvals.controller';
import { ModelsModule } from '../models/models.module';

@Module({
  imports: [ModelsModule],
  controllers: [ApprovalsController],
  providers: [ApprovalsService, ApprovalService],
  exports: [ApprovalsService, ApprovalService],
})
export class ApprovalsModule {}
