import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DataDeletionController } from './data-deletion.controller';
import { DataDeletionService } from './data-deletion.service';
import { DataDeletionRequestSchema } from './schemas/data-deletion-request.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'DataDeletionRequest', schema: DataDeletionRequestSchema },
    ]),
  ],
  controllers: [DataDeletionController],
  providers: [DataDeletionService],
  exports: [DataDeletionService],
})
export class DataDeletionModule {}
