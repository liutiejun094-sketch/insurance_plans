import * as mongoose from 'mongoose';

export interface HistoryDocument extends mongoose.Document {
  title: string;
  planIds: string[];
  resultId: string;
  count: number;
  date: string;
  createdAt: Date;
}

export const HistorySchema = new mongoose.Schema<HistoryDocument>({
  title: { type: String, required: true },
  planIds: [{ type: String, required: true }],
  resultId: { type: String, required: true },
  count: { type: Number, required: true },
  date: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

export const History = mongoose.model<HistoryDocument>('History', HistorySchema);
