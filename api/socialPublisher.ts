// SocialPublisher abstraction
export interface SocialPublisher {
  publish(content: any, options?: any): Promise<any>;
}

export class AyrsharePublisher implements SocialPublisher {
  async publish(content: any, options?: any): Promise<any> {
    // TODO: Integrate with Ayrshare API
    return { status: 'stubbed' };
  }
}
