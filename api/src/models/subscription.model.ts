import { Schema, model } from 'mongoose';

const SubscriptionSchema = new Schema({
  tenantId: String,
  plan: String,
  renewal: Date,
});

export { SubscriptionSchema };
// Do not export compiled model. Use MongooseModule.forFeature in modules.
