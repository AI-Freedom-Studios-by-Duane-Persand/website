// api/src/tenants/tenants.module.ts
import { Module } from '@nestjs/common';
import { TenantsService } from './tenants.service';
import { TenantsController } from './tenants.controller';
import { ModelsModule } from '../models/models.module';
import { MongooseModule } from '@nestjs/mongoose';
import { TenantSchema } from '../models/tenant.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Tenant', schema: TenantSchema }]),
  ],
  providers: [TenantsService],
  controllers: [TenantsController],
  exports: [TenantsService, MongooseModule],
})
export class TenantsModule {}
