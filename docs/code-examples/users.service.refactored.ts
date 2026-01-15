/**
 * Refactored Users Service Template
 * 
 * This is a reference template showing how to refactor services to use the repository pattern.
 * FILE LOCATION: docs/code-examples/users.service.refactored.ts
 * 
 * Do NOT place this file in the actual source tree, as it will be compiled.
 * Use it as a reference when refactoring api/src/users/users.service.ts
 */

import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { UserRepository } from './repositories/user.repository';
import { TenantContextService } from '../../infrastructure/context/tenant-context';
import { Transactional } from '../../infrastructure/decorators/transactional.decorator';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    private readonly userRepository: UserRepository,
    private readonly tenantContext: TenantContextService,
  ) {}

  @Transactional()
  async create(createUserDto: any): Promise<any> {
    try {
      const tenantId = this.tenantContext.getTenantId();

      // Check if email already exists within tenant
      const existingUser = await this.userRepository.findByEmail(createUserDto.email, tenantId);
      if (existingUser) {
        throw new BadRequestException(`Email ${createUserDto.email} is already in use`);
      }

      const user = await this.userRepository.create(
        {
          email: createUserDto.email,
          name: createUserDto.name,
          role: createUserDto.role || 'user',
          tenantId,
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

  async findById(userId: string): Promise<any> {
    const tenantId = this.tenantContext.getTenantId();
    const user = await this.userRepository.findById(userId, tenantId);

    if (!user) {
      throw new NotFoundException(`User ${userId} not found`);
    }

    return this.mapToUserDto(user);
  }

  async findByEmail(email: string): Promise<any | null> {
    const tenantId = this.tenantContext.getTenantId();
    const user = await this.userRepository.findByEmail(email, tenantId);

    if (!user) {
      return null;
    }

    return this.mapToUserDto(user);
  }

  async findAll(
    page: number = 1,
    pageSize: number = 10,
    filter?: any,
  ): Promise<{ items: any[]; total: number; page: number; pageSize: number }> {
    const tenantId = this.tenantContext.getTenantId();
    const result = await this.userRepository.getPaginated(tenantId, page, pageSize, filter);

    return {
      items: result.items.map((u) => this.mapToUserDto(u)),
      total: result.pagination.total,
      page: result.pagination.page,
      pageSize: result.pagination.pageSize,
    };
  }

  async findActive(page: number = 1, pageSize: number = 10): Promise<any[]> {
    const tenantId = this.tenantContext.getTenantId();
    const users = await this.userRepository.findActive(tenantId, {
      skip: (page - 1) * pageSize,
      limit: pageSize,
    });
    return users.map((u) => this.mapToUserDto(u));
  }

  async getStatistics(): Promise<any> {
    const tenantId = this.tenantContext.getTenantId();
    return this.userRepository.getStatistics(tenantId);
  }

  @Transactional()
  async update(userId: string, updateDto: any): Promise<any> {
    const tenantId = this.tenantContext.getTenantId();

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

  @Transactional()
  async deactivate(userId: string): Promise<any> {
    const tenantId = this.tenantContext.getTenantId();

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

  @Transactional()
  async delete(userId: string): Promise<boolean> {
    const tenantId = this.tenantContext.getTenantId();

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

  private mapToUserDto(user: any): any {
    return {
      id: user._id?.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
      tenantId: user.tenantId,
      createdAt: user.createdAt,
    };
  }
}
