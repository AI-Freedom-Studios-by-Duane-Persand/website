import { Module } from '@nestjs/common';
import { TenantContextService } from './context/tenant-context';

@Module({
  providers: [TenantContextService],
  exports: [TenantContextService],
})
export class InfrastructureModule {}
