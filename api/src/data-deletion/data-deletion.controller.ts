import { Body, Controller, Post, Get, Param, UseGuards } from '@nestjs/common';
import { DataDeletionService } from './data-deletion.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

class SubmitDeletionRequestDto {
  email!: string;
  reason?: string;
}

@Controller('api/data-deletion')
export class DataDeletionController {
  constructor(private readonly dataDeletionService: DataDeletionService) {}

  /**
   * Submit a data deletion request (public endpoint)
   */
  @Post('request')
  async submitRequest(@Body() dto: SubmitDeletionRequestDto) {
    return this.dataDeletionService.submitRequest(dto.email, dto.reason);
  }

  /**
   * Get all deletion requests (admin only)
   */
  @UseGuards(JwtAuthGuard)
  @Get('requests')
  async getAllRequests() {
    return this.dataDeletionService.getAllRequests();
  }

  /**
   * Get deletion requests by email
   */
  @Get('requests/:email')
  async getRequestsByEmail(@Param('email') email: string) {
    return this.dataDeletionService.getRequestsByEmail(email);
  }

  /**
   * Process a deletion request (admin only)
   */
  @UseGuards(JwtAuthGuard)
  @Post('process/:requestId')
  async processDeletion(@Param('requestId') requestId: string) {
    await this.dataDeletionService.processDeletion(requestId);
    return { message: 'Deletion processed successfully' };
  }
}
