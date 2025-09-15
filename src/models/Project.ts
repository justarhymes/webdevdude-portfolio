import { Schema, model, models, InferSchemaType } from "mongoose";

const RelationSchema = new Schema(
  {
    slug: { type: String, required: true, index: true },
    name: { type: String },
  },
  { _id: false }
);

const ProjectSchema = new Schema(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true, index: true },

    summary: { type: String },
    description: { type: String },
    primaryLink: { type: String },
    secondaryLink: { type: String },
    thumb: { type: String },
    media: { type: [String], default: [] },

    skills: { type: [RelationSchema], default: [] },
    tasks: { type: [RelationSchema], default: [] },
    type: { type: RelationSchema, default: undefined },
    client: { type: RelationSchema, default: undefined },
    studio: { type: RelationSchema, default: undefined },

    published: { type: Boolean, default: false, index: true },
    featured: { type: Boolean, default: false, index: true },
    order: { type: Number, default: 0, index: true },
  },
  { timestamps: true }
);

// Optimize the common listing sort: featured DESC, order ASC, createdAt DESC
ProjectSchema.index({ featured: -1, order: 1, createdAt: -1 });

export type ProjectDoc = InferSchemaType<typeof ProjectSchema>;
export const Project = models.Project || model("Project", ProjectSchema);
