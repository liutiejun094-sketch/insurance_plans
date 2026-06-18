import { Injectable, Logger } from '@nestjs/common';
import { LlmService } from '../services/llm.service';
import { CHAT_SYSTEM_PROMPT } from '../config/prompts.config';

export interface ChatResult {
  answer: string;
  topicScope: 'in_scope' | 'out_of_scope';
  redirectMessage: string | null;
}

// 话题边界关键词检测
const OUT_OF_SCOPE_KEYWORDS = [
  '推荐', '哪个好', '买哪个', '产品推荐', '购买', '投保',
  '保费预算', '划算', '性价比', '最值得', '最好',
];

const OTHER_INSURANCE_KEYWORDS = [
  '寿险', '意外险', '车险', '家财险', '旅游险',
  '教育金', '年金险', '分红险', '万能险', '投连险',
];

const REDIRECT_MESSAGES = {
  recommendation:
    '我无法提供产品推荐或购买建议。建议您使用对比功能分析不同方案，或咨询专业的保险顾问获取个性化建议。',
  otherInsurance: (keyword: string) =>
    `抱歉，我仅支持解答百万医疗险和重疾险相关问题。关于${keyword}，建议您咨询专业的保险顾问或相关专业人士。`,
  purchaseProcess:
    '具体投保流程建议咨询保险公司官方渠道，或前往保险公司官网了解详情。',
};

@Injectable()
export class AdvisorService {
  private readonly logger = new Logger(AdvisorService.name);

  constructor(private readonly llmService: LlmService) {}

  /**
   * 话题边界检测
   */
  checkTopicScope(question: string): { scope: 'in_scope' | 'out_of_scope'; message: string | null } {
    const lowerQuestion = question.toLowerCase();

    // 检查是否询问其他险种
    for (const keyword of OTHER_INSURANCE_KEYWORDS) {
      if (lowerQuestion.includes(keyword)) {
        return {
          scope: 'out_of_scope',
          message: REDIRECT_MESSAGES.otherInsurance(keyword),
        };
      }
    }

    // 检查是否要求产品推荐
    for (const keyword of OUT_OF_SCOPE_KEYWORDS) {
      if (lowerQuestion.includes(keyword)) {
        return {
          scope: 'out_of_scope',
          message: REDIRECT_MESSAGES.recommendation,
        };
      }
    }

    // 检查购买流程相关
    if (lowerQuestion.includes('怎么买') || lowerQuestion.includes('投保流程') || lowerQuestion.includes('投保手续')) {
      return {
        scope: 'out_of_scope',
        message: REDIRECT_MESSAGES.purchaseProcess,
      };
    }

    return { scope: 'in_scope', message: null };
  }

  /**
   * 对话接口
   */
  async chat(question: string, context?: string): Promise<ChatResult> {
    // 话题边界校验
    const scopeCheck = this.checkTopicScope(question);
    if (scopeCheck.scope === 'out_of_scope') {
      return {
        answer: scopeCheck.message || '',
        topicScope: 'out_of_scope',
        redirectMessage: scopeCheck.message,
      };
    }

    // 构建提示词
    const prompt = this.buildPrompt(question, context);

    try {
      // 调用 LLM（使用对话型 System Prompt，保留默认 temperature
      const answer = await this.llmService.requestLLM(prompt, {
        systemPrompt: CHAT_SYSTEM_PROMPT,
        temperature: 0.7,
        maxTokens: 8192,
      });

      return {
        answer,
        topicScope: 'in_scope',
        redirectMessage: null,
      };
    } catch (error) {
      this.logger.error(`LLM 调用失败: ${error.message}`, error.stack);
      throw new Error('当前咨询人数较多，请稍后再试');
    }
  }

  /**
   * 构建用户提示词
   */
  private buildPrompt(question: string, context?: string): string {
    let prompt = question;

    if (context) {
      prompt = `当前上下文：${context}\n\n用户问题：${question}`;
    }

    return prompt;
  }
}
