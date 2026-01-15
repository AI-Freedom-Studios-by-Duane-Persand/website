/**
 * Mongoose Base Repository Implementation
 * 
 * Provides generic CRUD operations with multi-tenancy support.
 * Implements IBaseRepository<T> from the domain layer.
 * 
 * Usage:
 * export class CampaignRepository extends MongooseBaseRepository<Campaign> {
 *   constructor(
 *     @InjectModel(Campaign.name) private readonly model: Model<Campaign>,
 *   ) {
 *     super(model);
 *   }
 * }
 */

import {
  BadRequestException,
  Injectable,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { Model, ClientSession, FilterQuery, UpdateQuery, PipelineStage } from 'mongoose';
import { IBaseRepository } from '../../domain/repositories/base.repository.interface';

/**
 * Generic Base Repository with Mongoose implementation
 * Automatically scopes all queries to the provided tenant ID
 */
@Injectable()
export class MongooseBaseRepository<T extends Record<string, any> = any>
  implements IBaseRepository<T> {
  
  constructor(
    protected readonly model: Model<T>,
  ) {}

  /**
   * Apply tenant scoping to a filter
   * Adds tenantId to all queries for data isolation
   */
  protected applyScopedFilter(
    filter: Partial<T> = {},
    tenantId: string,
  ): FilterQuery<T> {
    return {
      ...filter,
      tenantId,
    } as FilterQuery<T>;
  }

  /**
   * Find a single document by ID, scoped to tenant
   */
  async findById(id: string, tenantId: string): Promise<T | null> {
    try {
      const filter = this.applyScopedFilter({ _id: id } as any, tenantId);
      return await this.model.findOne(filter).exec();
    } catch (error) {
      throw this.handleError(error, `Failed to find document by ID: ${id}`);
    }
  }

  /**
   * Find a single document by criteria, scoped to tenant
   */
  async findOne(criteria: Partial<T>, tenantId: string): Promise<T | null> {
    try {
      const filter = this.applyScopedFilter(criteria, tenantId);
      return await this.model.findOne(filter).exec();
    } catch (error) {
      throw this.handleError(error, 'Failed to find document');
    }
  }

  /**
   * Find multiple documents by criteria, scoped to tenant
   */
  async find(
    criteria: Partial<T> = {},
    tenantId: string,
    options?: {
      skip?: number;
      limit?: number;
      sort?: Record<string, 1 | -1>;
    },
  ): Promise<T[]> {
    try {
      const filter = this.applyScopedFilter(criteria, tenantId);
      let query = this.model.find(filter);

      if (options?.skip) {
        query = query.skip(options.skip);
      }

      if (options?.limit) {
        query = query.limit(options.limit);
      }

      if (options?.sort) {
        query = query.sort(options.sort);
      }

      return await query.exec();
    } catch (error) {
      throw this.handleError(error, 'Failed to find documents');
    }
  }

  /**
   * Create a new document
   */
  async create(data: Partial<T>, tenantId: string): Promise<T> {
    try {
      const document = new this.model({ ...data, tenantId });
      return await document.save();
    } catch (error) {
      throw this.handleError(error, 'Failed to create document');
    }
  }

  /**
   * Create multiple documents
   */
  async createMany(data: Partial<T>[], tenantId: string): Promise<T[]> {
    try {
      const docsWithTenant = data.map((doc) => ({ ...doc, tenantId }));
      return await this.model.insertMany(docsWithTenant);
    } catch (error) {
      throw this.handleError(error, 'Failed to create documents');
    }
  }

  /**
   * Update a document by ID
   */
  async updateById(id: string, updates: Partial<T>, tenantId: string): Promise<T | null> {
    try {
      const filter = this.applyScopedFilter({ _id: id } as any, tenantId);
      return await this.model.findOneAndUpdate(filter, updates, { new: true }).exec();
    } catch (error) {
      throw this.handleError(error, `Failed to update document: ${id}`);
    }
  }

  /**
   * Update multiple documents
   */
  async updateMany(
    criteria: Partial<T>,
    updates: Partial<T>,
    tenantId: string,
  ): Promise<number> {
    try {
      const filter = this.applyScopedFilter(criteria, tenantId);
      const result = await this.model.updateMany(filter, updates).exec();
      return result.modifiedCount;
    } catch (error) {
      throw this.handleError(error, 'Failed to update documents');
    }
  }

  /**
   * Delete a document by ID
   */
  async deleteById(id: string, tenantId: string): Promise<boolean> {
    try {
      const filter = this.applyScopedFilter({ _id: id } as any, tenantId);
      const result = await this.model.deleteOne(filter).exec();
      return result.deletedCount > 0;
    } catch (error) {
      throw this.handleError(error, `Failed to delete document: ${id}`);
    }
  }

  /**
   * Delete multiple documents
   */
  async deleteMany(criteria: Partial<T>, tenantId: string): Promise<number> {
    try {
      const filter = this.applyScopedFilter(criteria, tenantId);
      const result = await this.model.deleteMany(filter).exec();
      return result.deletedCount;
    } catch (error) {
      throw this.handleError(error, 'Failed to delete documents');
    }
  }

  /**
   * Count documents matching criteria
   */
  async count(criteria: Partial<T> = {}, tenantId: string): Promise<number> {
    try {
      const filter = this.applyScopedFilter(criteria, tenantId);
      return await this.model.countDocuments(filter).exec();
    } catch (error) {
      throw this.handleError(error, 'Failed to count documents');
    }
  }

  /**
   * Check if a document exists
   */
  async exists(criteria: Partial<T>, tenantId: string): Promise<boolean> {
    try {
      const filter = this.applyScopedFilter(criteria, tenantId);
      const result = await this.model.exists(filter).exec();
      return result !== null;
    } catch (error) {
      throw this.handleError(error, 'Failed to check if document exists');
    }
  }

  /**
   * Execute raw MongoDB operations (use sparingly)
   */
  async executeRaw<R = any>(
    operation: (model: Model<T>) => Promise<R>,
  ): Promise<R> {
    try {
      return await operation(this.model);
    } catch (error) {
      throw this.handleError(error, 'Failed to execute raw operation');
    }
  }

  /**
   * Get the underlying Mongoose model
   */
  getModel(): Model<T> {
    return this.model;
  }

  /**
   * Centralized error handling
   */
  protected handleError(error: any, context: string): Error {
    // Handle specific Mongoose errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors)
        .map((err: any) => err.message)
        .join(', ');
      throw new BadRequestException(`Validation error: ${messages}`);
    }

    if (error.name === 'CastError') {
      throw new BadRequestException(`Invalid ID format: ${error.value}`);
    }

    if (error.code === 11000) {
      // Duplicate key error
      const field = Object.keys(error.keyPattern)[0];
      throw new BadRequestException(`Duplicate value for field: ${field}`);
    }

    if (error instanceof NotFoundException) {
      throw error;
    }

    // Log unexpected errors
    console.error(`[${this.model.name}] ${context}:`, error);

    throw new InternalServerErrorException(
      `Database operation failed: ${context}`,
    );
  }
}

/**
 * Advanced Base Repository with helper methods
 * Extend this for additional utility methods like pagination, aggregation, etc.
 */
@Injectable()
export class AdvancedMongooseRepository<T extends Record<string, any> = any>
  extends MongooseBaseRepository<T> {
  
  /**
   * Find with pagination
   */
  async findWithPagination(
    criteria: Partial<T> = {},
    tenantId: string,
    page: number = 1,
    pageSize: number = 10,
    sort?: Record<string, 1 | -1>,
  ) {
    const skip = (page - 1) * pageSize;
    const [items, total] = await Promise.all([
      this.find(criteria, tenantId, { skip, limit: pageSize, sort }),
      this.count(criteria, tenantId),
    ]);

    return {
      items,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
        hasNextPage: page < Math.ceil(total / pageSize),
        hasPreviousPage: page > 1,
      },
    };
  }

  /**
   * Create aggregation pipeline with automatic tenant scoping
   */
  async aggregate<R = any>(
    pipeline: (PipelineStage | Record<string, any>)[],
    tenantId: string,
  ): Promise<R[]> {
    try {
      // Auto-scope the first stage to tenant
      const scopedPipeline: (PipelineStage | Record<string, any>)[] = [
        {
          $match: { tenantId },
        },
        ...pipeline,
      ];

      return await (this.model.aggregate(scopedPipeline as PipelineStage[]) as any).exec();
    } catch (error) {
      throw this.handleError(error, 'Aggregation pipeline failed');
    }
  }
}
