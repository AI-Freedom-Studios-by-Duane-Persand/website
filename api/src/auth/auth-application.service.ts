/**
 * Auth Application Service
 * 
 * Handles complex authentication workflows and business logic.
 * Orchestrates multiple services for signup, login, and user management.
 * 
 * Responsibilities:
 * - User signup orchestration (tenant + user + subscription)
 * - Password hashing
 * - Early access validation
 * - Business rule enforcement
 * 
 * Controllers should delegate to this service for complex auth operations.
 * Transaction management is handled by @Transactional decorators on service methods.
 */

import {
  Injectable,
  ConflictException,
  InternalServerErrorException,
  Logger,
  BadRequestException
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { UsersService } from '../users/users.service';
import { TenantsService } from '../tenants/tenants.service';
import { isEmailWhitelisted } from './early-access.config';

export interface SignupRequest {
  email: string;
  password: string;
  tenant: string;
}

export interface SignupResult {
  user: any;
  tenant: any;
}

@Injectable()
export class AuthApplicationService {
  private readonly logger = new Logger(AuthApplicationService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly tenantsService: TenantsService,
  ) {}

  /**
   * Handle user signup with tenant creation
   * 
   * Orchestrates:
   * 1. Email validation and duplicate check
   * 2. Tenant creation/lookup
   * 3. Password hashing
   * 4. User creation
   * 5. Tenant-user linking
   * 6. Subscription activation
   * 
   * Transaction management is handled by @Transactional decorators on individual service methods.
   * 
   * @param request Signup request data
   * @returns Created user and tenant
   * @throws ConflictException if email already exists
   * @throws BadRequestException if validation fails
   * @throws InternalServerErrorException on unexpected errors
   */
  async signup(request: SignupRequest): Promise<SignupResult> {
    this.validateSignupRequest(request);

    // Early optimization check - avoid transaction overhead if email already exists
    const existingUser = await this.usersService.findByEmail(request.email);
    if (existingUser) {
      throw new ConflictException('Email already registered. Please use a different email or sign in.');
    }

    try {
      // Step 1: Create or find tenant
      const tenant = await this.tenantsService.findOrCreateByName(
        request.tenant,
        request.email,
        undefined // No manual session - services handle transactions
      );

      this.logger.log(`Tenant resolved: ${tenant._id}`);

      // Step 2: Hash password
      const passwordHash = await this.hashPassword(request.password);

      // Step 3: Check early access status
      const hasEarlyAccess = isEmailWhitelisted(request.email);

      // Step 4: Create user (UsersService.create has @Transactional decorator)
      const user = await this.createUser({
        email: request.email,
        passwordHash,
        tenantId: tenant._id.toString(),
        hasEarlyAccess,
      });

      this.logger.log(`User created: ${user._id}`);

      // Step 5: Update tenant with owner information
      await this.linkUserToTenant(tenant._id.toString(), user._id.toString());

      // Step 6: Activate tenant subscription
      await this.activateTenantSubscription(tenant._id.toString());

      return { user, tenant };

    } catch (error) {
      // Handle specific error types
      if (error instanceof ConflictException) {
        throw error;
      }

      // Handle MongoDB duplicate key errors
      if (this.isDuplicateKeyError(error)) {
        throw new ConflictException('Email already registered. Please use a different email or sign in.');
      }

      // Log and rethrow as internal server error
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error('Signup failed', error);
      throw new InternalServerErrorException('Signup failed: ' + errorMessage);
    }
  }

  /**
   * Validate signup request data
   */
  private validateSignupRequest(request: SignupRequest): void {
    if (!request.email || !request.password || !request.tenant) {
      throw new BadRequestException('Missing required fields: email, password, and tenant are required');
    }

    if (!request.email.includes('@')) {
      throw new BadRequestException('Invalid email format');
    }

    if (request.password.length < 8) {
      throw new BadRequestException('Password must be at least 8 characters');
    }

    if (!this.tenantsService.isValidTenantName(request.tenant)) {
      throw new BadRequestException('Invalid tenant name. Use 3-50 alphanumeric characters, dashes, or underscores');
    }
  }

  /**
   * Hash password using bcrypt
   */
  private async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }

  /**
   * Create user with proper error handling
   */
  private async createUser(params: {
    email: string;
    passwordHash: string;
    tenantId: string;
    hasEarlyAccess: boolean;
  }): Promise<any> {
    try {
      return await this.usersService.create(
        {
          email: params.email,
          password: '', // Legacy field
          passwordHash: params.passwordHash,
          name: params.email.split('@')[0],
          role: 'tenantOwner',
          roles: ['tenantOwner'],
          tenantId: params.tenantId,
          isEarlyAccess: params.hasEarlyAccess,
        },
        params.tenantId // Pass tenantId as second parameter
      );
    } catch (error) {
      // Handle duplicate key error
      if (this.isDuplicateKeyError(error)) {
        this.logger.warn(`Duplicate email detected: ${params.email}`);
        throw new ConflictException('Email already registered. Please use a different email or sign in.');
      }
      throw error;
    }
  }

  /**
   * Link user to tenant as owner
   */
  private async linkUserToTenant(
    tenantId: string,
    userId: string
  ): Promise<void> {
    await this.tenantsService.update(
      tenantId,
      {
        ownerId: userId,
        userIds: [userId],
      },
      undefined // No manual session
    );
  }

  /**
   * Activate tenant subscription
   */
  private async activateTenantSubscription(
    tenantId: string
  ): Promise<void> {
    await this.tenantsService.update(
      tenantId,
      {
        subscriptionStatus: 'active',
      },
      undefined // No manual session
    );
  }

  /**
   * Check if error is a MongoDB duplicate key error
   */
  private isDuplicateKeyError(error: any): boolean {
    return (
      error?.code === 11000 ||
      error?.message?.includes('E11000') ||
      error?.message?.includes('duplicate key')
    );
  }
}
