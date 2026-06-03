import { Injectable, Logger } from '@nestjs/common';
import { Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull';
import { PlanService } from '../plan/plan.service';
import { OcrService } from '../services/ocr.service';
import { LlmService } from '../services/llm.service';
import { CompareService } from '../compare/compare.service';
import { TaskStatus, AnalyzeProgress, ParsedInsurance, Difference } from '../types';
import { PlanDto } from './dto/analyze.dto';

interface PlanWithContent {
  id: string;
  name: string;
  content: string;
  inputType: string;
  fileName?: string;
}

@Injectable()
export class AnalyzeService {
  private readonly logger = new Logger(AnalyzeService.name);
  private taskProgress: Map<string, AnalyzeProgress> = new Map();

  constructor(
    @InjectQueue('analyze') private analyzeQueue: Queue,
    private planService: PlanService,
    private ocrService: OcrService,
    private llmService: LlmService,
    private compareService: CompareService,
  ) {}

  async startAnalyze(plans: PlanDto[]): Promise<{ taskId: string; status: TaskStatus }> {
    const job = await this.analyzeQueue.add({ plans });
    const jobId = String(job.id);
    
    this.taskProgress.set(jobId, {
      status: 'pending',
      progress: 0,
      message: '任务已创建',
    });

    this.processAnalyze(jobId, plans).catch((error) => {
      this.logger.error(`分析任务失败: ${jobId}`, error);
      this.taskProgress.set(jobId, {
        status: 'failed',
        progress: 0,
        message: error.message,
      });
    });

    return { taskId: jobId, status: 'processing' };
  }

  async getProgress(taskId: string): Promise<AnalyzeProgress> {
    const progress = this.taskProgress.get(taskId);
    if (!progress) {
      const job = await this.analyzeQueue.getJob(taskId);
      if (!job) {
        return { status: 'failed', progress: 0, message: '任务不存在' };
      }
      const state = await job.getState();
      return { status: state as TaskStatus, progress: 0 };
    }
    return progress;
  }

  private async processAnalyze(taskId: string, plans: PlanDto[]) {
    try {
      this.taskProgress.set(taskId, {
        status: 'processing',
        progress: 10,
        message: '正在获取方案数据...',
      });

      const plansWithContent: PlanWithContent[] = plans.map(p => ({
        id: p.id,
        name: p.name || '未命名方案',
        content: p.content || '',
        inputType: p.inputType,
        fileName: p.fileName,
      }));

      this.taskProgress.set(taskId, {
        status: 'parsing',
        progress: 40,
        message: '正在解析条款...',
      });

      const parsedResults: { id: string; name: string; parsedData: ParsedInsurance }[] = [];
      for (let i = 0; i < plansWithContent.length; i++) {
        const plan = plansWithContent[i];
        const parsedData = await this.llmService.parseInsurance(plan.content);
        parsedResults.push({
          id: plan.id,
          name: plan.name,
          parsedData,
        });
        
        this.taskProgress.set(taskId, {
          status: 'parsing',
          progress: 40 + Math.round((i + 1) / plansWithContent.length * 30),
          message: `正在解析方案 ${i + 1}/${plansWithContent.length}...`,
        });
      }

      this.taskProgress.set(taskId, {
        status: 'comparing',
        progress: 70,
        message: '正在对比差异...',
      });

      this.logger.log(`开始对比，输入数据: ${JSON.stringify(parsedResults, null, 2)}`);
      
      const differences: Difference[] = await this.llmService.comparePlans(parsedResults);
      this.logger.log(`对比结果: ${JSON.stringify(differences, null, 2)}`);

      this.taskProgress.set(taskId, {
        status: 'comparing',
        progress: 90,
        message: '正在保存结果...',
      });

      this.logger.log(`准备保存计划: ${JSON.stringify(parsedResults, null, 2)}`);
            
            const finalResult = {
                _id: `compare-${Date.now()}`,
                planIds: parsedResults.map(p => p.id),
                plans: parsedResults,
                differences,
                createdAt: new Date()
            };

            try {
                const planIds = parsedResults.map(p => p.id);
                const savedResult: any = await this.compareService.saveResult(
                    planIds,
                    parsedResults,
                    differences,
                );
                this.logger.log(`对比结果保存成功: ${savedResult._id}`);
                finalResult._id = savedResult._id;
            } catch (saveError) {
                this.logger.error(`保存结果失败，详细错误: ${JSON.stringify(saveError)}`);
            }

      this.taskProgress.set(taskId, {
        status: 'completed',
        progress: 100,
        message: '分析完成',
        result: finalResult,
      });
    } catch (error) {
      this.logger.error(`分析任务失败: ${taskId}`, error);
      this.taskProgress.set(taskId, {
        status: 'failed',
        progress: 0,
        message: error.message,
      });
    }
  }
}
