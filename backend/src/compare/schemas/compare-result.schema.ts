import * as mongoose from 'mongoose';

export const CompareResultSchema = new mongoose.Schema({
  name: { type: String, required: false },
  planIds: { type: [String], required: true },
  plans: { type: Array, required: true },
  differences: { type: Array, required: true },
  createdAt: { type: Date, default: Date.now },
}, { timestamps: false, strict: false });

export type CompareResultDocument = mongoose.InferSchemaType<typeof CompareResultSchema>;
export const CompareResult = mongoose.model<CompareResultDocument>('CompareResult', CompareResultSchema);
