import { Module } from '@nestjs/common';
import { MetaAdsService } from './meta-ads.service';
import { MetaAdsController } from './meta-ads.controller';

@Module({
  controllers: [MetaAdsController],
  providers: [MetaAdsService],
  exports: [MetaAdsService],
})
export class MetaAdsModule {}