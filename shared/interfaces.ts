export interface Tenant {
  _id: string;
  name: string;
  domain: string;
  ownerUserId: string;
  userIds: string[];
  subscriptionId?: string;
  createdAt: Date;
  updatedAt: Date;
}