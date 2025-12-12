import { Schema, model } from 'mongoose';

const TenantSchema = new Schema({
  name: String,
  subscription: String,
  integrationConfigs: Array,
});

export const TenantModel = model('Tenant', TenantSchema);
