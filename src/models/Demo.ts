import mongoose, { Schema } from "mongoose";
import { RelationalSubSchema } from "./_shared";

const DemoSchema = new Schema(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true, index: true },
    summary: { type: String },
    description: { type: String },
    url: { type: String },
    repoUrl: { type: String },
    thumb: { type: String },
    media: [{ type: String }],

    //
    skills: { type: [RelationalSubSchema], default: [] },
    type: { type: RelationalSubSchema, required: false },
    client: { type: RelationalSubSchema, required: false },
    studio: { type: RelationalSubSchema, required: false },

    published: { type: Boolean, default: false },
    featured: { type: Boolean, default: false },
    order: { type: Number },
  },
  { timestamps: true }
);

export type DemoDoc = mongoose.InferSchemaType<typeof DemoSchema>;
export const Demo = mongoose.models.Demo || mongoose.model("Demo", DemoSchema);