import { Injectable, NotFoundException } from '@nestjs/common';
import { User } from '../../../shared/types';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';
import { UserRepository } from './repositories/user.repository';
import { TenantContextService } from '../infrastructure/context/tenant-context';
import { Transactional } from '../infrastructure/decorators/transactional.decorator';

@Injectable()
export class UsersService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly tenantContext: TenantContextService,
  ) {}


  async findAll(query?: any, tenantId?: string): Promise<User[]> {
    const resolvedTenantId = tenantId || this.tenantContext.getTenantId();
    const filter = query || {};
    return (await this.userRepository.find(filter as any, resolvedTenantId)) as any;
  }


  async findOne(id: string, tenantId?: string): Promise<User> {
    const resolvedTenantId = tenantId || this.tenantContext.getTenantId();
    const user = await this.userRepository.findById(id, resolvedTenantId);
    if (!user) throw new NotFoundException('User not found');
    return user as any;
  }


  @Transactional()
  async create(createUserDto: CreateUserDto, tenantId?: string): Promise<User> {
    const resolvedTenantId = tenantId || this.tenantContext.getTenantId();
    const userData = { ...createUserDto, tenantId: resolvedTenantId };
    return (await this.userRepository.create(userData as any, resolvedTenantId)) as any;
  }


  async findByEmail(email: string, tenantId?: string): Promise<User | null> {
    const resolvedTenantId = tenantId || this.tenantContext.getTenantId();
    return (await this.userRepository.findByEmail(email, resolvedTenantId)) as any;
  }


  @Transactional()
  async update(id: string, updateUserDto: UpdateUserDto, tenantId?: string): Promise<User> {
    const resolvedTenantId = tenantId || this.tenantContext.getTenantId();
    const user = await this.userRepository.updateById(id, updateUserDto as any, resolvedTenantId);
    if (!user) throw new NotFoundException('User not found');
    return user as any;
  }

  @Transactional()
  async remove(id: string, tenantId?: string): Promise<{ deleted: boolean }> {
    const resolvedTenantId = tenantId || this.tenantContext.getTenantId();
    const result = await this.userRepository.deleteById(id, resolvedTenantId);
    return { deleted: result };
  }
}
