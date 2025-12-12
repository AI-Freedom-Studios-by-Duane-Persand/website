import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AdminPackagesController } from './admin-packages.controller';
import { Package, PackageSchema } from '../models/package.model';

@Module({
  imports: [MongooseModule.forFeature([{ name: Package.name, schema: PackageSchema }])],
  controllers: [AdminPackagesController],
})
export class AdminPackagesModule {}
