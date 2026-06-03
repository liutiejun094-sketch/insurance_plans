import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';
import * as https from 'https';
import { OCR_CONFIG } from '../config/ocr.config';

@Injectable()
export class OcrService {
  private readonly logger = new Logger(OcrService.name);

  private getSignature(params: Record<string, any>): string {
    const sortedKeys = Object.keys(params).sort();
    let canonicalQueryString = '';
    for (const key of sortedKeys) {
      canonicalQueryString += `${key}=${encodeURIComponent(params[key])}&`;
    }
    canonicalQueryString = canonicalQueryString.slice(0, -1);

    const stringToSign = `GET&%2F&${encodeURIComponent(canonicalQueryString)}`;
    const signature = crypto
      .createHmac('sha1', `${OCR_CONFIG.accessKeySecret}&`)
      .update(stringToSign)
      .digest('base64');

    return signature;
  }

  private async requestOCR(imageUrl: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const params: Record<string, any> = {
        Format: 'JSON',
        Version: OCR_CONFIG.apiVersion,
        AccessKeyId: OCR_CONFIG.accessKeyId,
        SignatureMethod: 'HMAC-SHA1',
        Timestamp: new Date().toISOString(),
        SignatureVersion: '1.0',
        Action: 'RecognizeDocument',
        ImageUrl: imageUrl,
        RecognizeDirection: true,
        DetectText: true,
      };

      params.Signature = this.getSignature(params);

      const url = `${OCR_CONFIG.endpoint}/?${new URLSearchParams(params).toString()}`;

      https.get(url, (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          try {
            const result = JSON.parse(data);
            if (result.Data && result.Data.Content) {
              resolve(result.Data.Content);
            } else {
              this.logger.warn(`OCR返回数据不完整: ${JSON.stringify(result)}`);
              resolve('');
            }
          } catch (error) {
            this.logger.error(`OCR解析失败: ${error}`);
            resolve('');
          }
        });
      }).on('error', (error) => {
        this.logger.error(`OCR请求失败: ${error}`);
        reject(error);
      });
    });
  }

  async recognizeImage(imageUrl: string): Promise<string> {
    try {
      return await this.requestOCR(imageUrl);
    } catch (error) {
      this.logger.error(`图片识别失败: ${imageUrl}`, error);
      return '';
    }
  }

  async recognizeImages(imageUrls: string[]): Promise<string> {
    const texts = await Promise.all(
      imageUrls.map((url) => this.recognizeImage(url)),
    );
    return texts.join('\n\n');
  }
}
