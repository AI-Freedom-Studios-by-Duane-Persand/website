// api/src/tenants/tenants.module.ts
import { Module, Logger, Injectable } from '@nestjs/common';
import { TenantsService } from './tenants.service';
import { TenantsController } from './tenants.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { TenantSchema } from './schemas/tenant.schema';
import { ModelsModule } from '../models/models.module';
import { UsersModule } from '../users/users.module';

@Injectable()
export class TenantsModuleLogger {
  constructor() {
    Logger.log('TenantsModule initialized', 'TenantsModuleLogger');
  }
}

@Module({
  imports: [
    UsersModule, // Import UsersModule to provide UsersService
    ModelsModule,
  ],
  providers: [TenantsService, TenantsModuleLogger],
  controllers: [TenantsController],
  exports: [TenantsService],
})
export class TenantsModule {}
