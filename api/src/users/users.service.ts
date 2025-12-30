import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../../../shared/types';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';
import { UserDocument } from './schemas/user.schema';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel('User') private readonly userModel: Model<UserDocument>,
  ) {}


  async findAll(query: any): Promise<User[]> {
    const docs = await this.userModel.find(query).exec();
    return docs.map(doc => ({
      _id: doc._id,
      email: doc.email,
      passwordHash: doc.passwordHash,
      tenantId: doc.tenantId,
      roles: doc.roles || [],
      isEarlyAccess: doc.isEarlyAccess ?? false,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    }));
  }


  async findOne(id: string): Promise<User> {
    const user = await this.userModel.findById(id).exec();
    if (!user) throw new NotFoundException('User not found');
    return {
      _id: user._id,
      email: user.email,
      passwordHash: user.passwordHash,
      tenantId: user.tenantId,
      roles: user.roles || [],
      isEarlyAccess: user.isEarlyAccess ?? false,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }


  async create(createUserDto: CreateUserDto, session?: any): Promise<User> {
    const options = { session };
    const createdUser = new this.userModel(createUserDto);
    return createdUser.save(options);
  }


  async findByEmail(email: string, tenantId?: string): Promise<User | null> {
    const query: any = { email };
    if (tenantId) query.tenantId = tenantId;
    const user = await this.userModel.findOne(query).exec();
    if (!user) return null;
    return {
      _id: user._id,
      email: user.email,
      passwordHash: user.passwordHash,
      tenantId: user.tenantId,
      roles: user.roles || [],
      isEarlyAccess: user.isEarlyAccess ?? false,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }


  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.userModel.findByIdAndUpdate(id, updateUserDto, { new: true }).exec();
    if (!user) throw new NotFoundException('User not found');
    return {
      _id: user._id,
      email: user.email,
      passwordHash: user.passwordHash,
      tenantId: user.tenantId,
      roles: user.roles || [],
      isEarlyAccess: user.isEarlyAccess ?? false,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  async remove(id: string): Promise<{ deleted: boolean }> {
    const res = await this.userModel.deleteOne({ _id: id }).exec();
    return { deleted: res.deletedCount > 0 };
  }
}
