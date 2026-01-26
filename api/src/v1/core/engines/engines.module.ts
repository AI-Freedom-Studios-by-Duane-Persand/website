import { Module } from '@nestjs/common';
import { EnginesModule as LegacyEnginesModule } from '../../../engines/engines.module';

/**
 * EnginesModule (V1)
 * 
 * Wraps existing engines module for v1 API structure.
 * Manages AI engine configurations and models.
 * 
 * Note: This module will be updated in Phase 4 to reference Python AI Content Service
 * instead of making direct calls to engine providers.
 */
@Module({
  imports: [LegacyEnginesModule],
  exports: [LegacyEnginesModule],
})
export class EnginesModuleV1 {}
