// api/src/auth/jwt.strategy.ts
import { Injectable, Inject } from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { LoggerService } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER) private readonly logger: LoggerService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        (req: Request) => {
          // Top-level extractor execution log
          this.logger?.debug?.('[JwtStrategy] Extractor function called', {
            context: 'JwtStrategy',
            timestamp: new Date().toISOString(),
            method: req?.method,
            url: req?.url,
          });
          // Structured debug log for incoming request
          this.logger?.debug?.('[JwtStrategy] Incoming request', {
            context: 'JwtStrategy',
            method: req?.method,
            url: req?.url,
            headers: req?.headers,
            cookies: req?.cookies,
            body: req?.body,
          });
          let token = null;
          if (req && req.headers && req.headers['authorization']) {
            const authHeader = req.headers['authorization'];
            if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
              token = authHeader.slice(7);
              this.logger?.debug?.('[JwtStrategy] Extracted JWT from Authorization header', {
                context: 'JwtStrategy',
                source: 'header',
                token: '[REDACTED]',
              });
            }
          }
          if (!token && req && req.cookies) {
            token = req.cookies['access_token'] || req.cookies['auth_token'] || null;
            this.logger?.debug?.('[JwtStrategy] Extracted JWT from cookie', {
              context: 'JwtStrategy',
              source: 'cookie',
              token: token ? '[REDACTED]' : null,
            });
          }
          const secret = process.env.JWT_SECRET || 'changeme';
          this.logger?.debug?.('[JwtStrategy] Using JWT secret', {
            context: 'JwtStrategy',
            secret: '[REDACTED]',
          });
          if (token) {
            try {
              jwt.verify(token, secret);
            } catch (err: any) {
              this.logger?.error?.('[JwtStrategy] JWT verification error', {
                context: 'JwtStrategy',
                name: err?.name,
                message: err?.message,
                stack: err?.stack,
                token: '[REDACTED]',
                secret: '[REDACTED]',
              });
            }
          } else {
            this.logger?.debug?.('[JwtStrategy] No JWT found in request', {
              context: 'JwtStrategy',
              source: 'none',
            });
          }
          return token;
        },
      ]),
      secretOrKey: process.env.JWT_SECRET || 'changeme',
    });
    // Log after super() to confirm Winston logger injection and strategy initialization
    this.logger?.debug?.('[JwtStrategy] Winston logger injected, strategy initialized', {
      context: 'JwtStrategy',
      timestamp: new Date().toISOString(),
    });
  }

  async validate(payload: any) {
    // Confirm validate method is reached
    this.logger?.debug?.('[JwtStrategy] validate() called', {
      context: 'JwtStrategy',
      timestamp: new Date().toISOString(),
      payload,
    });
    // Structured debug log for JWT payload validation
    this.logger?.debug?.('[JwtStrategy] Validating JWT payload', {
      context: 'JwtStrategy',
      payload,
    });
    try {
      this.logger?.debug?.('[JwtStrategy] JWT payload details', {
        context: 'JwtStrategy',
        payload,
      });
      if (!payload || !payload.sub || !payload.tenantId || !payload.email) {
        this.logger?.error?.('[JwtStrategy] Invalid JWT payload', {
          context: 'JwtStrategy',
          payload,
        });
        throw new Error('Invalid JWT payload');
      }
      // Accept either 'role' or 'roles' in the payload
      let roles: string[] = [];
      if (Array.isArray(payload.roles)) {
        roles = payload.roles;
      } else if (payload.role) {
        roles = [payload.role];
      }
      // For legacy compatibility, set 'role' to first role if only one
      const role = roles.length === 1 ? roles[0] : undefined;
      return {
        sub: payload.sub, // Map sub property correctly
        email: payload.email,
        tenantId: payload.tenantId,
        roles,
        ...(role ? { role } : {}),
      };
    } catch (err: any) {
      this.logger?.error?.('[JwtStrategy] Error in validate method', {
        context: 'JwtStrategy',
        name: err?.name,
        message: err?.message,
        stack: err?.stack,
        payload,
      });
      throw err;
    }
  }
}
