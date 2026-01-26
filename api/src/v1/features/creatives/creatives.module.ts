import { Module } from '@nestjs/common';
import { CreativesModule as LegacyCreativesModule } from '../../../creatives/creatives.module';

/**
 * CreativesModuleV1
 * 
 * Wraps existing creatives module for v1 API structure.
 * Manages content creatives and asset versioning.
 * 
 * Integration Notes:
 * - Will be updated in Phase 4 to use ContentGenerationService
 * - Currently uses legacy direct API calls
 * - Will support webhook callbacks from Python service for video generation
 */
@Module({
  imports: [LegacyCreativesModule],
  exports: [LegacyCreativesModule],
})
export class CreativesModuleV1 {}
