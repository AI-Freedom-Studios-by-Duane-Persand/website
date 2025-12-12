export interface Subscription {
    _id?: string;
    userId: string;
    packageId: string;
    status: 'active' | 'pending' | 'cancelled' | 'expired';
    stripeSessionId?: string;
    paymentLink?: string;
    validUntil?: string;
    createdAt?: string;
    updatedAt?: string;
}
//# sourceMappingURL=subscriptionV2.dto.d.ts.map