import { Injectable, Logger } from '@nestjs/common';
import { CompareResult, CompareResultDocument } from './schemas/compare-result.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ParsedInsurance, Difference } from '../types';

interface PlanData {
  id: string;
  name: string;
  parsedData: ParsedInsurance;
}

@Injectable()
export class CompareService {
  private readonly logger = new Logger(CompareService.name);

  constructor(@InjectModel(CompareResult.name) private compareResultModel: Model<CompareResultDocument>) {}

  async saveResult(planIds: string[], plans: PlanData[], differences: Difference[]): Promise<CompareResultDocument> {
    const result = new this.compareResultModel({
      name: `Compare-${Date.now()}`,
      planIds,
      plans,
      differences,
    });
    return result.save();
  }

  async findOne(id: string): Promise<CompareResultDocument | null> {
    return this.compareResultModel.findById(id).exec();
  }

  async findByPlanIds(planIds: string[]): Promise<CompareResultDocument | null> {
    return this.compareResultModel.findOne({ planIds: { $all: planIds } }).exec();
  }

  async remove(id: string): Promise<CompareResultDocument | null> {
    return this.compareResultModel.findByIdAndDelete(id).exec();
  }
}
