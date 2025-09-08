import { Schema, model, models } from "mongoose";

const TaskSchema = new Schema({
  slug: { type: String, index: { unique: true, sparse: true } },
  name: { type: String, required: true },
});

export const Task = models.Task || model("Task", TaskSchema);
