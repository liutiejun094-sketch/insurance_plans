import { Injectable, Logger } from '@nestjs/common';
import * as https from 'https';
import { LLM_CONFIG, PROVIDER_CONFIGS } from '../config/llm.config';
import { PARSE_SYSTEM_PROMPT, INSURANCE_PARSE_PROMPT, COMPARE_PROMPT } from '../config/prompts.config';
import { ParsedInsurance, Difference } from '../types';

interface RequestOptions {
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
}

@Injectable()
export class LlmService {
  private readonly logger = new Logger(LlmService.name);

  private getProviderConfig() {
    const config = PROVIDER_CONFIGS[LLM_CONFIG.provider];
    if (!config) {
      throw new Error(`Unsupported provider: ${LLM_CONFIG.provider}`);
    }
    return {
      baseUrl: LLM_CONFIG.baseUrl || config.baseUrl,
      models: config.models,
    };
  }

  /**
   * 通用 LLM 请求
   * @param prompt 用户提示词
   * @param options 可选参数：systemPrompt、temperature、maxTokens
   */
  async requestLLM(prompt: string, options: RequestOptions = {}): Promise<string> {
    const systemPrompt = options.systemPrompt ?? PARSE_SYSTEM_PROMPT;
    const temperature = options.temperature ?? LLM_CONFIG.temperature;
    const maxTokens = options.maxTokens ?? 8192;

    return new Promise((resolve, reject) => {
      const { baseUrl } = this.getProviderConfig();
      const url = new URL(baseUrl);

      let payload: any;
      const reqOptions: https.RequestOptions = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${LLM_CONFIG.apiKey}`,
        },
      };

      if (LLM_CONFIG.provider === 'tongyi') {
        payload = {
          model: LLM_CONFIG.model,
          prompt,
          temperature,
          max_tokens: maxTokens,
        };
      } else if (LLM_CONFIG.provider === 'openai' || LLM_CONFIG.provider === 'deepseek') {
        payload = {
          model: LLM_CONFIG.model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt },
          ],
          temperature,
          max_tokens: maxTokens,
        };
      } else if (LLM_CONFIG.provider === 'claude') {
        payload = {
          model: LLM_CONFIG.model,
          messages: [
            { role: 'user', content: `${systemPrompt}\n\n${prompt}` },
          ],
          max_tokens: maxTokens,
        };
        reqOptions.headers['anthropic-version'] = '2023-06-01';
      } else {
        payload = {
          model: LLM_CONFIG.model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt },
          ],
          temperature,
          max_tokens: maxTokens,
        };
      }

      const req = https.request(url, reqOptions, (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          try {
            const result = JSON.parse(data);
            let answer = '';

            if (LLM_CONFIG.provider === 'tongyi') {
              answer = result.output?.text || '';
            } else if (LLM_CONFIG.provider === 'openai' || LLM_CONFIG.provider === 'deepseek') {
              answer = result.choices?.[0]?.message?.content || '';
            } else if (LLM_CONFIG.provider === 'claude') {
              answer = result.content?.[0]?.text || '';
            } else {
              answer = result.choices?.[0]?.message?.content || result.output?.text || '';
            }

            if (!answer) {
              this.logger.warn(`LLM返回数据不完整: ${JSON.stringify(result)}`);
              resolve('');
            }

            resolve(answer);
          } catch (error) {
            this.logger.error(`LLM解析失败: ${error}`);
            resolve('');
          }
        });
      });

      req.on('error', (error) => {
        this.logger.error(`LLM请求失败: ${error}`);
        reject(error);
      });

      req.write(JSON.stringify(payload));
      req.end();
    });
  }

  /**
   * 保险条款解析：输出纯 JSON
   * - 使用简洁的 PARSE_SYSTEM_PROMPT
   * - temperature = 0（确保输出稳定的 JSON 结构）
   */
  async parseInsurance(text: string): Promise<ParsedInsurance> {
    const prompt = INSURANCE_PARSE_PROMPT.replace('{content}', text);
    try {
      const response = await this.requestLLM(prompt, {
        systemPrompt: PARSE_SYSTEM_PROMPT,
        temperature: 0,
        maxTokens: 8192,
      });
      if (!response) {
        return {};
      }
      return this.safeJsonParse(response);
    } catch (error) {
      this.logger.error(`保险条款解析失败`, error);
      return {};
    }
  }

  /**
   * 方案对比：输出纯 JSON
   * - 使用简洁的 PARSE_SYSTEM_PROMPT
   * - temperature = 0（确保输出稳定的 JSON 结构）
   */
  async comparePlans(plans: { id: string; name: string; parsedData: ParsedInsurance }[]): Promise<Difference[]> {
    const plansJson = JSON.stringify(
      plans.map((p) => ({
        planId: p.id,
        planName: p.name,
        ...p.parsedData,
      })),
      null,
      2,
    );

    const prompt = COMPARE_PROMPT.replace('{plans}', plansJson);
    try {
      const response = await this.requestLLM(prompt, {
        systemPrompt: PARSE_SYSTEM_PROMPT,
        temperature: 0,
        maxTokens: 4096,
      });
      if (!response) {
        return [];
      }
      return this.safeJsonParse(response);
    } catch (error) {
      this.logger.error(`方案对比失败`, error);
      return [];
    }
  }

  /**
   * 从 LLM 响应中安全提取 JSON
   * 处理三种常见情况：
   * 1. 响应本身就是 JSON
   * 2. 响应被 ```json ... ``` 代码块包裹
   * 3. 响应被 ``` ... ``` 代码块包裹
   */
  private safeJsonParse<T = any>(text: string): T {
    if (!text) return {} as T;

    let jsonStr = text.trim();

    // 去掉 Markdown 代码块包裹
    const codeBlockMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    if (codeBlockMatch) {
      jsonStr = codeBlockMatch[1].trim();
    }

    // 找到第一个 { 或 [，最后一个 } 或 ]
    const firstBrace = jsonStr.indexOf('{');
    const firstBracket = jsonStr.indexOf('[');
    let startIndex = -1;
    let endChar: string;

    if (firstBrace === -1 && firstBracket === -1) {
      this.logger.warn(`LLM响应中未找到 JSON: ${jsonStr.substring(0, 100)}`);
      return {} as T;
    }

    if (firstBrace === -1) {
      startIndex = firstBracket;
      endChar = ']';
    } else if (firstBracket === -1) {
      startIndex = firstBrace;
      endChar = '}';
    } else {
      startIndex = Math.min(firstBrace, firstBracket);
      endChar = startIndex === firstBrace ? '}' : ']';
    }

    const endIndex = jsonStr.lastIndexOf(endChar);
    if (endIndex <= startIndex) {
      this.logger.warn(`LLM响应 JSON 格式异常: ${jsonStr.substring(0, 100)}`);
      return {} as T;
    }

    jsonStr = jsonStr.substring(startIndex, endIndex + 1);

    try {
      return JSON.parse(jsonStr) as T;
    } catch (error) {
      this.logger.error(`JSON 解析失败: ${jsonStr.substring(0, 200)}`);
      return {} as T;
    }
  }
}
