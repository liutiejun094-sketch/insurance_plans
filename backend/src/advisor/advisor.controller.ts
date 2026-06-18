import { Controller, Post, Get, Body, HttpException, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AdvisorService, ChatResult } from './advisor.service';
import { LlmService } from '../services/llm.service';

class ChatDto {
  question: string;
  context?: string;
}

@ApiTags('advisor')
@Controller('api/advisor')
export class AdvisorController {
  constructor(
    private readonly advisorService: AdvisorService,
    private readonly llmService: LlmService,
  ) {}

  @Get('test')
  @ApiOperation({ summary: '测试LLM API连接' })
  async testLLM() {
    try {
      const result = await this.llmService.testLLM();
      return {
        code: 200,
        data: result,
      };
    } catch (error) {
      return {
        code: 500,
        data: { success: false, error: error.message },
      };
    }
  }

  @Post('chat')
  @ApiOperation({ summary: '保险顾问智能体对话接口' })
  @ApiResponse({ status: 200, description: '对话成功' })
  @ApiResponse({ status: 500, description: '服务器错误' })
  async chat(@Body() chatDto: ChatDto) {
    try {
      if (!chatDto.question || chatDto.question.trim().length === 0) {
        throw new HttpException('问题不能为空', HttpStatus.BAD_REQUEST);
      }

      const result = await this.advisorService.chat(chatDto.question, chatDto.context);
      return {
        code: 200,
        data: result,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        error.message || '对话服务异常，请稍后再试',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
