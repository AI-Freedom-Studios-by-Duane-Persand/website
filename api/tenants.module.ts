// TenantsModule scaffold
import { Module } from '@nestjs/common';
import { TenantsService } from './src/tenants/tenants.service';
import { TenantsController } from './src/tenants/tenants.controller';

@Module({
  providers: [TenantsService],
  controllers: [TenantsController],
})
export class TenantsModule {}
