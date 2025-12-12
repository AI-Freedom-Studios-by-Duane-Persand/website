// api/src/auth/roles.guard.ts
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles) {
      return true;
    }
    const { user } = context.switchToHttp().getRequest();
    if (!user) return false;
    // Normalize user.roles array
    let normalizedRoles: string[] = [];
    if (Array.isArray(user.roles)) {
      normalizedRoles = user.roles.map((role: string) => String(role).trim().replace(/,$/, '').toLowerCase());
    }
    // Also check user.role (single string)
    if (typeof user.role === 'string') {
      normalizedRoles.push(user.role.trim().toLowerCase());
    }
    // Accept if any user role matches requiredRoles
    return requiredRoles.map(r => r.toLowerCase()).some(required => normalizedRoles.includes(required));
  }
}
