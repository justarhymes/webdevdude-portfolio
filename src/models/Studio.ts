import { Schema, model, models } from 'mongoose';

const StudioSchema = new Schema({
  slug: { type: String, index: { unique: true, sparse: true } },
  name: { type: String, required: true },
});

export const Studio = models.Studio || model('Studio', StudioSchema);
