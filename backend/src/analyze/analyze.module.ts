import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { AnalyzeController } from './analyze.controller';
import { AnalyzeService } from './analyze.service';
import { PlanModule } from '../plan/plan.module';
import { OcrService } from '../services/ocr.service';
import { LlmService } from '../services/llm.service';
import { CompareModule } from '../compare/compare.module';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'analyze',
    }),
    PlanModule,
    CompareModule,
  ],
  controllers: [AnalyzeController],
  providers: [AnalyzeService, OcrService, LlmService],
})
export class AnalyzeModule {}
