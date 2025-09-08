import mongoose, { Schema } from "mongoose";
import { RelationalSubSchema } from "./_shared";

const ResumeItemSchema = new Schema(
  {
    section: {
      type: String,
      enum: ["experience", "projects", "education", "awards", "skills", "other"],
      required: true,
      index: true,
    },
    title: { type: String, required: true },
    organization: { type: String },
    location: { type: String },

    startDate: { type: String, required: true },
    endDate: { type: String },
    current: { type: Boolean, default: false },

    bullets: { type: [String], default: [] },
    links: {
      type: [{ label: String, href: String }],
      default: [],
    },

    skills: { type: [RelationalSubSchema], default: [] },

    order: { type: Number },
    hidden: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export type ResumeItemSchema = mongoose.InferSchemaType<typeof ResumeItemSchema>;
export const ResumeItem = mongoose.models.ResumeItem || mongoose.model("ResumeItem", ResumeItemSchema);