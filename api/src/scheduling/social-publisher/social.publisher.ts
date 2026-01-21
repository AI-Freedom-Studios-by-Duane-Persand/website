// api/src/scheduling/social-publisher/social.publisher.ts
import { ObjectId } from 'mongodb';
import { CreativeDocument } from '../../models/creative.schema';

export interface SocialPublisher {
  publishOrganicPost(args: {
    tenantId: ObjectId;
    userId?: ObjectId;
    creative: CreativeDocument;
    platforms: string[];
  }): Promise<{ platformIds: Record<string, string> }>;
}
