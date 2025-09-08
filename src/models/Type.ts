import { Schema, model, models } from 'mongoose';

const TypeSchema = new Schema({
  name: {
    type: String,
    enum: ['Business', 'Web App', 'eCommerce', 'Mobile App'],
    required: true,
  },
  slug: { type: String, index: { unique: true, sparse: true } },
});

export const Type = models.Type || model('Type', TypeSchema);
