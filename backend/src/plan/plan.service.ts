import { Injectable, Logger } from '@nestjs/common';
import { Plan, PlanDocument } from './schemas/plan.schema';
import { CreatePlanDto } from './dto/create-plan.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class PlanService {
  private readonly logger = new Logger(PlanService.name);

  constructor(@InjectModel(Plan.name) private planModel: Model<PlanDocument>) {}

  async create(createPlanDto: CreatePlanDto): Promise<PlanDocument> {
    const plan = new this.planModel(createPlanDto);
    return plan.save();
  }

  async findAll(): Promise<PlanDocument[]> {
    return this.planModel.find().sort({ createdAt: -1 }).exec();
  }

  async findOne(id: string): Promise<PlanDocument | null> {
    return this.planModel.findById(id).exec();
  }

  async findByIds(ids: string[]): Promise<PlanDocument[]> {
    return this.planModel.find({ _id: { $in: ids } }).exec();
  }

  async update(id: string, updatePlanDto: UpdatePlanDto): Promise<PlanDocument | null> {
    return this.planModel.findByIdAndUpdate(id, { ...updatePlanDto, updatedAt: Date.now() }, { new: true }).exec();
  }

  async remove(id: string): Promise<PlanDocument | null> {
    return this.planModel.findByIdAndDelete(id).exec();
  }

  async updateParsedData(id: string, parsedData: any): Promise<PlanDocument | null> {
    return this.planModel.findByIdAndUpdate(id, { parsedData, updatedAt: Date.now() }, { new: true }).exec();
  }
}
