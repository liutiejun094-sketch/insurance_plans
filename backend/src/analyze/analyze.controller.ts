import { Controller, Post, Get, Param, Body, HttpException, HttpStatus } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AnalyzeDto } from './dto/analyze.dto';
import { AnalyzeService } from './analyze.service';

@ApiTags('analyze')
@Controller('api/analyze')
export class AnalyzeController {
  constructor(private readonly analyzeService: AnalyzeService) {}

  @Post()
  async analyze(@Body() analyzeDto: AnalyzeDto) {
    try {
      if (!analyzeDto.plans || analyzeDto.plans.length < 2) {
        throw new HttpException('至少需要2份方案进行对比', HttpStatus.BAD_REQUEST);
      }

      const task = await this.analyzeService.startAnalyze(analyzeDto.plans);
      return { code: 200, data: task };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get(':taskId')
  async getProgress(@Param('taskId') taskId: string) {
    try {
      const progress = await this.analyzeService.getProgress(taskId);
      return { code: 200, data: progress };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
