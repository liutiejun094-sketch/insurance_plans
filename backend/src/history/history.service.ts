import { Injectable, Logger } from '@nestjs/common';
import { History, HistoryDocument } from './schemas/history.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as dayjs from 'dayjs';

@Injectable()
export class HistoryService {
  private readonly logger = new Logger(HistoryService.name);

  constructor(@InjectModel(History.name) private historyModel: Model<HistoryDocument>) {}

  async create(planIds: string[], resultId: string, count: number): Promise<HistoryDocument> {
    const history = new this.historyModel({
      title: `方案对比 ${dayjs().format('YYYY-MM-DD HH:mm')}`,
      planIds,
      resultId,
      count,
      date: dayjs().format('YYYY-MM-DD'),
    });
    return history.save();
  }

  async findAll(): Promise<HistoryDocument[]> {
    return this.historyModel.find().sort({ createdAt: -1 }).exec();
  }

  async findOne(id: string): Promise<HistoryDocument | null> {
    return this.historyModel.findById(id).exec();
  }

  async remove(id: string): Promise<HistoryDocument | null> {
    return this.historyModel.findByIdAndDelete(id).exec();
  }
}
