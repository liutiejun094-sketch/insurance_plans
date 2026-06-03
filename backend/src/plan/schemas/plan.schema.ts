import * as mongoose from 'mongoose';
import { InputType, ParsedInsurance, FileInfo } from '../../types';

export interface PlanDocument extends mongoose.Document {
  name: string;
  inputType: InputType;
  content?: string;
  fileInfo?: Partial<FileInfo>;
  images?: string[];
  parsedData?: Partial<ParsedInsurance>;
  createdAt: Date;
  updatedAt: Date;
}

export const PlanSchema = new mongoose.Schema<PlanDocument>({
  name: { type: String, required: true },
  inputType: { type: String, enum: ['text', 'file', 'image'], default: 'text' },
  content: { type: String, default: '' },
  fileInfo: {
    name: String,
    size: Number,
    type: String,
    url: String,
  },
  images: [{ type: String }],
  parsedData: { type: mongoose.Schema.Types.Mixed },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export const Plan = mongoose.model<PlanDocument>('Plan', PlanSchema);
