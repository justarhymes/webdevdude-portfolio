import { Schema, model, models } from 'mongoose';

const ClientSchema = new Schema({
  slug: { type: String, index: { unique: true, sparse: true } },
  name: { type: String, required: true },
});

export const Client = models.Client || model('Client', ClientSchema);
