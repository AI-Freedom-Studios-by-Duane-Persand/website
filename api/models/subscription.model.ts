import { Schema, model } from 'mongoose';

const SubscriptionSchema = new Schema({
  tenantId: String,
  plan: String,
  renewal: Date,
});

export const SubscriptionModel = model('Subscription', SubscriptionSchema);
