import { Schema } from "mongoose";

export const RelationalSubSchema = new Schema(
  {
    slug: { type: String, required: true, index: true },
    name: { type: String },
  },
  { _id: false }
);