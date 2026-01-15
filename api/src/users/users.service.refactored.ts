/**
 * Refactored Users Service
 * 
 * Now uses UserRepository instead of direct model injection.
 * Automatically gets tenant context from TenantContextService.
 * Uses @Transactional decorator for transaction management.
 */

import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { UserRepository } from './repositories/user.repository';
import { TenantContextService } from '../../infrastructure/context/tenant-context';
import { Transactional } from '../../infrastructure/decorators/transactional.decorator';
import { CreateUserDto } from '../dtos/create-user.dto';
import { UpdateUserDto } from '../dtos/update-user.dto';
import { UserDto } from '../dtos/user.dto';

/**
 * UsersService - Business logic for user management
 * 
 * Now uses:
 * - UserRepository for data access (no direct model injection)
 * - TenantContextService for automatic tenant scoping
 * - @Transactional decorator for session/transaction management
 */
@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    private readonly userRepository: UserRepository,
    private readonly tenantContext: TenantContextService,
  ) {}

  /**
   * Create a new user
   * Uses @Transactional for automatic session management
   */
  @Transactional()
  async create(createUserDto: CreateUserDto): Promise<UserDto> {
    try {
      const tenantId = this.tenantContext.getTenantId();

      // Check if email already exists within tenant
      const existingUser = await this.userRepository.findByEmail(createUserDto.email, tenantId);
      if (existingUser) {
        throw new BadRequestException(`Email ${createUserDto.email} is already in use`);
      }

      // Create new user
      const user = await this.userRepository.create(
        {
          email: createUserDto.email,
          name: createUserDto.name,
          role: createUserDto.role || 'user',
          tenantId,
          isDeactivated: false,
          createdAt: new Date(),
        } as any,
        tenantId,
      );

      this.logger.log(`User created: ${user._id}`);
      return this.mapToUserDto(user);
    } catch (error) {
      this.logger.error('User creation failed', error);
      throw error;
    }
  }

  /**
   * Get user by ID
   * Automatically scoped to tenant
   */
  async findById(userId: string): Promise<UserDto> {
    const tenantId = this.tenantContext.getTenantId();
    const user = await this.userRepository.findById(userId, tenantId);

    if (!user) {
      throw new NotFoundException(`User ${userId} not found`);
    }

    return this.mapToUserDto(user);
  }

  /**
   * Get user by email within tenant
   */
  async findByEmail(email: string): Promise<UserDto | null> {
    const tenantId = this.tenantContext.getTenantId();
    const user = await this.userRepository.findByEmail(email, tenantId);

    if (!user) {
      return null;
    }

    return this.mapToUserDto(user);
  }

  /**
   * Get all users for the current tenant
   * Uses built-in pagination support
   */
  async findAll(
    page: number = 1,
    pageSize: number = 10,
    filter?: { role?: string; isDeactivated?: boolean },
  ): Promise<{ items: UserDto[]; total: number; page: number; pageSize: number }> {
    const tenantId = this.tenantContext.getTenantId();
    const result = await this.userRepository.getPaginated(
      tenantId,
      page,
      pageSize,
      filter,
    );

    return {
      items: result.items.map((u) => this.mapToUserDto(u)),
      total: result.pagination.total,
      page: result.pagination.page,
      pageSize: result.pagination.pageSize,
    };
  }

  /**
   * Get active users only
   */
  async findActive(page: number = 1, pageSize: number = 10): Promise<UserDto[]> {
    const tenantId = this.tenantContext.getTenantId();
    const users = await this.userRepository.findActive(tenantId, {
      skip: (page - 1) * pageSize,
      limit: pageSize,
    });
    return users.map((u) => this.mapToUserDto(u));
  }

  /**
   * Get users by role
   */
  async findByRole(role: string, page: number = 1, pageSize: number = 10): Promise<UserDto[]> {
    const tenantId = this.tenantContext.getTenantId();
    const users = await this.userRepository.findByRole(role, tenantId);
    const paginated = users.slice((page - 1) * pageSize, page * pageSize);
    return paginated.map((u) => this.mapToUserDto(u));
  }

  /**
   * Search users by name or email
   */
  async search(query: string): Promise<UserDto[]> {
    const tenantId = this.tenantContext.getTenantId();
    const users = await this.userRepository.search(query, tenantId);
    return users.map((u) => this.mapToUserDto(u));
  }

  /**
   * Get user statistics
   */
  async getStatistics(): Promise<{
    total: number;
    active: number;
    deactivated: number;
    byRole: Record<string, number>;
  }> {
    const tenantId = this.tenantContext.getTenantId();
    return this.userRepository.getStatistics(tenantId);
  }

  /**
   * Find inactive users (no login for X days)
   */
  async findInactiveUsers(days: number = 30): Promise<UserDto[]> {
    const tenantId = this.tenantContext.getTenantId();
    const users = await this.userRepository.findInactiveUsers(days, tenantId);
    return users.map((u) => this.mapToUserDto(u));
  }

  /**
   * Update user
   * Uses @Transactional for automatic session management
   */
  @Transactional()
  async update(userId: string, updateDto: UpdateUserDto): Promise<UserDto> {
    const tenantId = this.tenantContext.getTenantId();

    // Verify ownership before update
    const user = await this.userRepository.findById(userId, tenantId);
    if (!user) {
      throw new NotFoundException(`User ${userId} not found`);
    }

    const updated = await this.userRepository.updateById(userId, updateDto as any, tenantId);

    if (!updated) {
      throw new NotFoundException(`Failed to update user ${userId}`);
    }

    this.logger.log(`User updated: ${userId}`);
    return this.mapToUserDto(updated);
  }

  /**
   * Update user's last login timestamp
   */
  @Transactional()
  async updateLastLogin(userId: string): Promise<UserDto> {
    const tenantId = this.tenantContext.getTenantId();

    const updated = await this.userRepository.updateLastLogin(userId, tenantId);

    if (!updated) {
      throw new NotFoundException(`User ${userId} not found`);
    }

    this.logger.log(`Last login updated: ${userId}`);
    return this.mapToUserDto(updated);
  }

  /**
   * Deactivate user
   * Uses @Transactional for automatic session management
   */
  @Transactional()
  async deactivate(userId: string): Promise<UserDto> {
    const tenantId = this.tenantContext.getTenantId();

    // Verify ownership before deactivating
    const user = await this.userRepository.findById(userId, tenantId);
    if (!user) {
      throw new NotFoundException(`User ${userId} not found`);
    }

    const updated = await this.userRepository.deactivateUser(userId, tenantId);

    if (!updated) {
      throw new NotFoundException(`Failed to deactivate user ${userId}`);
    }

    this.logger.log(`User deactivated: ${userId}`);
    return this.mapToUserDto(updated);
  }

  /**
   * Reactivate user
   * Uses @Transactional for automatic session management
   */
  @Transactional()
  async reactivate(userId: string): Promise<UserDto> {
    const tenantId = this.tenantContext.getTenantId();

    // Verify ownership before reactivating
    const user = await this.userRepository.findById(userId, tenantId);
    if (!user) {
      throw new NotFoundException(`User ${userId} not found`);
    }

    const updated = await this.userRepository.reactivateUser(userId, tenantId);

    if (!updated) {
      throw new NotFoundException(`Failed to reactivate user ${userId}`);
    }

    this.logger.log(`User reactivated: ${userId}`);
    return this.mapToUserDto(updated);
  }

  /**
   * Delete user
   * Uses @Transactional for automatic session management
   */
  @Transactional()
  async delete(userId: string): Promise<boolean> {
    const tenantId = this.tenantContext.getTenantId();

    // Verify ownership before delete
    const exists = await this.userRepository.findById(userId, tenantId);
    if (!exists) {
      throw new NotFoundException(`User ${userId} not found`);
    }

    const deleted = await this.userRepository.deleteById(userId, tenantId);

    if (deleted) {
      this.logger.log(`User deleted: ${userId}`);
    }

    return deleted;
  }

  /**
   * Map user document to DTO
   */
  private mapToUserDto(user: any): UserDto {
    return {
      id: user._id?.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
      isDeactivated: user.isDeactivated,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
      tenantId: user.tenantId,
    } as UserDto;
  }
}
