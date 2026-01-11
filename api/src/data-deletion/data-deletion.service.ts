import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Document } from 'mongoose';

export interface DataDeletionRequest {
  email: string;
  reason?: string;
  requestedAt: Date;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  completedAt?: Date;
}

export type DataDeletionDocument = DataDeletionRequest & Document;

@Injectable()
export class DataDeletionService {
  private readonly logger = new Logger(DataDeletionService.name);

  constructor(
    @InjectModel('DataDeletionRequest')
    private readonly dataDeletionModel: Model<DataDeletionDocument>,
  ) {}

  /**
   * Submit a data deletion request
   */
  async submitRequest(email: string, reason?: string): Promise<DataDeletionRequest> {
    const normalizedEmail = email.toLowerCase().trim();
    this.logger.log(`[submitRequest] Received deletion request`, { emailHash: Buffer.from(normalizedEmail).toString('base64').slice(0, 8) });

    // Prevent duplicate pending/processing requests for the same email
    const existing = await this.dataDeletionModel.findOne({
      email: normalizedEmail,
      status: { $in: ['pending', 'processing'] },
    }).exec();

    if (existing) {
      throw new BadRequestException('A deletion request is already pending for this email.');
    }

    const request = await this.dataDeletionModel.create({
      email: normalizedEmail,
      reason: reason?.trim(),
      requestedAt: new Date(),
      status: 'pending',
    });

    this.logger.log(`[submitRequest] Created deletion request with ID: ${request._id}`);

    // TODO: Send confirmation email to user
    // TODO: Notify admins of pending deletion request
    // TODO: Schedule actual deletion job (after 30 days or immediately based on policy)

    return request.toObject();
  }

  /**
   * Get all deletion requests (admin only)
   */
  async getAllRequests(): Promise<DataDeletionRequest[]> {
    return this.dataDeletionModel.find().sort({ requestedAt: -1 }).exec();
  }

  /**
   * Get deletion requests by email
   */
  async getRequestsByEmail(email: string): Promise<DataDeletionRequest[]> {
    return this.dataDeletionModel
      .find({ email: email.toLowerCase().trim() })
      .sort({ requestedAt: -1 })
      .exec();
  }

  /**
   * Process a deletion request (admin action)
   * This should:
   * 1. Delete user account
   * 2. Delete all creatives
   * 3. Delete all campaigns
   * 4. Revoke social media tokens
   * 5. Delete storage files
   * 6. Mark request as completed
   */
  async processDeletion(requestId: string): Promise<void> {
    const request = await this.dataDeletionModel.findById(requestId).exec();
    if (!request) {
      throw new NotFoundException('Deletion request not found');
    }

    try {
      this.logger.log(`[processDeletion] Starting deletion for requestId: ${request.id}`);
      
      request.status = 'processing';
      await request.save();

      // TODO: Implement actual deletion logic
      // 1. Find user by email
      // 2. Delete all associated data
      // 3. Revoke OAuth tokens
      // 4. Delete files from storage

      request.status = 'completed';
      request.completedAt = new Date();
      await request.save();

      this.logger.log(`[processDeletion] Completed deletion for requestId: ${request.id}`);
    } catch (error: any) {
      const safeMessage = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
      this.logger.error(`[processDeletion] Failed to process deletion for requestId: ${request.id}. ${safeMessage}`);
      request.status = 'failed';
      await request.save();
      throw error;
    }
  }
}
