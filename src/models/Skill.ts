import { Schema, model, models } from 'mongoose';

const SkillSchema = new Schema({
  slug: { type: String, index: { unique: true, sparse: true } },
  name: { type: String, required: true },
});

export const Skill = models.Skill || model('Skill', SkillSchema);
