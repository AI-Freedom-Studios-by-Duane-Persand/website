export interface CreateTenantDto {
  name: string;
  planId?: string | null;
  stripeCustomerId?: string | null;
  subscriptionStatus: 'active' | 'expired' | 'pending' | 'none';
}

export type UpdateTenantDto = Partial<CreateTenantDto> & {
  ownerId?: string;
  userIds?: string[];
};
