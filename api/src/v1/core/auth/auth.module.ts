import { Module } from '@nestjs/common';
import { AuthModule as LegacyAuthModule } from '../../../auth/auth.module';

/**
 * AuthModule (V1)
 * 
 * Wraps existing auth module for v1 API structure.
 * Maintains backward compatibility while providing /v1/ routing layer.
 */
@Module({
  imports: [LegacyAuthModule],
  exports: [LegacyAuthModule],
})
export class AuthModuleV1 {}
