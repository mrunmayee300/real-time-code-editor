import mongoose, { Schema, type InferSchemaType } from "mongoose";

const documentSchema = new Schema(
  {
    roomId: { type: String, required: true, unique: true, index: true },
    content: { type: String, default: "" },
    version: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export type DocumentDoc = InferSchemaType<typeof documentSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const DocumentModel =
  mongoose.models.Document || mongoose.model("Document", documentSchema);
