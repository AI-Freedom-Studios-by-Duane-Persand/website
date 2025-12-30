// api/src/auth/jwt-auth.guard.ts
import { Injectable, ExecutionContext, Inject } from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(
    private reflector: Reflector,
    @Inject(WINSTON_MODULE_NEST_PROVIDER) private readonly logger: any,
  ) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest();
    this.logger?.debug?.('[JwtAuthGuard] canActivate called', {
      context: 'JwtAuthGuard',
      timestamp: new Date().toISOString(),
      headers: req?.headers,
      cookies: req?.cookies,
      url: req?.url,
      method: req?.method,
    });

    // Development bypass to unblock local testing when auth tokens are missing.
    if (process.env.SKIP_AUTH_CHECK === 'true') {
      this.logger?.warn?.('[JwtAuthGuard] SKIP_AUTH_CHECK enabled – bypassing JWT validation for this request', {
        context: 'JwtAuthGuard',
        url: req?.url,
        method: req?.method,
      });
      // Provide a minimal user shape so downstream code relying on req.user does not break.
      req.user = req.user || { sub: 'dev-user', tenantId: req?.body?.tenantId || 'dev-tenant', roles: ['dev'] };
      return true;
    }
    return super.canActivate(context);
  }
}
