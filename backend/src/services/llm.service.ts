import { Injectable, Logger } from '@nestjs/common';
import * as https from 'https';
import { LLM_CONFIG, PROVIDER_CONFIGS } from '../config/llm.config';
import { ParsedInsurance, Difference } from '../types';

const INSURANCE_PARSE_PROMPT = `
请解析以下保险条款文本，提取关键信息并以JSON格式输出：

文本内容：
{content}

请提取以下字段：
- company: 保险公司名称
- productName: 产品名称
- insuranceType: 保险类型（重疾险/百万医疗险/意外险等）
- coveragePeriod: 保障期限（如：终身、至70岁、20年等）
- paymentPeriod: 缴费期限（如：20年、30年等）
- waitingPeriod: 等待期（如：90天、180天等）
- generalMedical: 一般医疗保障（对象，百万医疗险适用）
  - coverage: 一般医疗保额（字符串）
  - deductible: 免赔额（字符串）
  - reimbursementRatio: 报销比例（字符串）
- criticalIllness: 重疾/特殊疾病医疗保障（对象）
  - coverage: 重疾医疗保额（字符串）
  - types: 重疾种类数量（数字，如有）
  - payoutRatio: 赔付比例（字符串，如有）
  - payoutCount: 赔付次数（数字，如有）
- mildIllness: 轻症保障信息（对象，重疾险适用）
  - payoutRatio: 赔付比例（字符串）
  - payoutCount: 赔付次数（数字）
- middleIllness: 中症保障信息（对象，重疾险适用）
  - payoutRatio: 赔付比例（字符串）
  - payoutCount: 赔付次数（数字）
- protonTherapy: 质子重离子保障（对象，百万医疗险适用）
  - coverage: 质子重离子保额（字符串）
  - reimbursementRatio: 报销比例（字符串）
- deathCoverage: 身故保障（字符串）
- premium: 年保费（字符串）
- exclusions: 免责条款数量或关键免责内容（数组）

如果某个字段无法从文本中提取，请设为null。
输出必须是纯JSON格式，不要包含其他内容。
`;

const COMPARE_PROMPT = `
请对比以下保险方案，找出关键差异并以JSON格式输出：

方案列表：
{plans}

对比要求：
1. 只关注对投保人有实际影响的关键差异
2. 输出格式为JSON数组，每个元素包含：
   - field: 字段标识（英文）
   - fieldLabel: 字段名称（中文）
   - values: 各方案对应的值数组，每个元素包含 planId, planName, value
   - impact: 对投保人的影响，可选值：advantage（优势）、disadvantage（劣势）、neutral（中性）、same（相同）
   - summary: 差异说明

输出必须是纯JSON格式，不要包含其他内容。
`;

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

  private async requestLLM(prompt: string, maxTokens: number = 8192): Promise<string> {
    return new Promise((resolve, reject) => {
      const { baseUrl } = this.getProviderConfig();
      const url = new URL(baseUrl);

      let payload: any;
      let options: https.RequestOptions = {
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
          temperature: LLM_CONFIG.temperature,
          max_tokens: maxTokens,
        };
      } else if (LLM_CONFIG.provider === 'openai' || LLM_CONFIG.provider === 'deepseek') {
        payload = {
          model: LLM_CONFIG.model,
          messages: [
            { role: 'system', content: '你是一个专业的保险条款分析专家。' },
            { role: 'user', content: prompt },
          ],
          temperature: LLM_CONFIG.temperature,
          max_tokens: maxTokens,
        };
        options.headers['Content-Type'] = 'application/json';
      } else if (LLM_CONFIG.provider === 'claude') {
        payload = {
          model: LLM_CONFIG.model,
          messages: [
            { role: 'user', content: prompt },
          ],
          max_tokens: maxTokens,
        };
        options.headers['Content-Type'] = 'application/json';
        options.headers['anthropic-version'] = '2023-06-01';
      } else {
        payload = {
          model: LLM_CONFIG.model,
          prompt,
          temperature: LLM_CONFIG.temperature,
          max_tokens: maxTokens,
        };
      }

      const req = https.request(url, options, (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          try {
            const result = JSON.parse(data);
            
            if (LLM_CONFIG.provider === 'tongyi') {
              if (result.output && result.output.text) {
                resolve(result.output.text);
              } else {
                this.logger.warn(`LLM返回数据不完整: ${JSON.stringify(result)}`);
                resolve('');
              }
            } else if (LLM_CONFIG.provider === 'openai' || LLM_CONFIG.provider === 'deepseek') {
              if (result.choices && result.choices[0] && result.choices[0].message && result.choices[0].message.content) {
                resolve(result.choices[0].message.content);
              } else {
                this.logger.warn(`LLM返回数据不完整: ${JSON.stringify(result)}`);
                resolve('');
              }
            } else if (LLM_CONFIG.provider === 'claude') {
              if (result.content && result.content[0] && result.content[0].text) {
                resolve(result.content[0].text);
              } else {
                this.logger.warn(`LLM返回数据不完整: ${JSON.stringify(result)}`);
                resolve('');
              }
            } else {
              if (result.output && result.output.text) {
                resolve(result.output.text);
              } else if (result.choices && result.choices[0] && result.choices[0].text) {
                resolve(result.choices[0].text);
              } else {
                this.logger.warn(`LLM返回数据不完整: ${JSON.stringify(result)}`);
                resolve('');
              }
            }
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

  async parseInsurance(text: string): Promise<ParsedInsurance> {
    const prompt = INSURANCE_PARSE_PROMPT.replace('{content}', text);
    try {
      const response = await this.requestLLM(prompt);
      if (!response) {
        return {};
      }
      return JSON.parse(response);
    } catch (error) {
      this.logger.error(`保险条款解析失败`, error);
      return {};
    }
  }

  async comparePlans(plans: { id: string; name: string; parsedData: ParsedInsurance }[]): Promise<Difference[]> {
    const plansJson = JSON.stringify(plans.map(p => ({
      planId: p.id,
      planName: p.name,
      ...p.parsedData,
    })), null, 2);

    const prompt = COMPARE_PROMPT.replace('{plans}', plansJson);
    try {
      const response = await this.requestLLM(prompt, 4096);
      if (!response) {
        return [];
      }
      return JSON.parse(response);
    } catch (error) {
      this.logger.error(`方案对比失败`, error);
      return [];
    }
  }
}
