import { Module } from '@nestjs/common';
import { AdvisorController } from './advisor.controller';
import { AdvisorService } from './advisor.service';
import { LlmService } from '../services/llm.service';

@Module({
  controllers: [AdvisorController],
  providers: [AdvisorService, LlmService],
  exports: [AdvisorService],
})
export class AdvisorModule {}
