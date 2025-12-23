import { Schema, model } from 'mongoose';

const TenantSchema = new Schema({
  name: String,
  subscription: String,
  integrationConfigs: Array,
  ownerId: { type: String, required: true }, // Unique identifier for the owner
  userIds: { type: [String], default: [] }, // Array of user identifiers
});

export { TenantSchema };
// Do not export compiled model. Use MongooseModule.forFeature in modules.
