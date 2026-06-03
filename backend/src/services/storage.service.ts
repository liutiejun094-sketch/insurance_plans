import { Injectable, Logger } from '@nestjs/common';
import * as OSS from 'ali-oss';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private client: OSS | null = null;

  constructor() {
    this.initClient();
  }

  private initClient() {
    const accessKeyId = process.env.ALIYUN_ACCESS_KEY_ID;
    const accessKeySecret = process.env.ALIYUN_ACCESS_KEY_SECRET;
    const endpoint = process.env.OSS_ENDPOINT;
    const bucket = process.env.OSS_BUCKET;

    if (accessKeyId && accessKeySecret && endpoint && bucket) {
      this.client = new OSS({
        region: endpoint.split('.')[0].replace('oss-', ''),
        accessKeyId,
        accessKeySecret,
        bucket,
        endpoint: `https://${endpoint}`,
      });
    } else {
      this.logger.warn('OSS配置不完整，将使用本地存储模拟');
    }
  }

  async uploadFile(file: Buffer, filename: string): Promise<string> {
    if (!this.client) {
      return `http://localhost:3000/uploads/${filename}`;
    }

    try {
      const result = await this.client.put(`plans/${filename}`, file);
      return result.url;
    } catch (error) {
      this.logger.error(`文件上传失败: ${error}`);
      throw new Error('文件上传失败');
    }
  }

  async uploadImage(file: Buffer, filename: string): Promise<string> {
    if (!this.client) {
      return `http://localhost:3000/images/${filename}`;
    }

    try {
      const result = await this.client.put(`images/${filename}`, file);
      return result.url;
    } catch (error) {
      this.logger.error(`图片上传失败: ${error}`);
      throw new Error('图片上传失败');
    }
  }

  async deleteFile(url: string): Promise<void> {
    if (!this.client) {
      return;
    }

    try {
      const key = url.replace(`https://${process.env.OSS_BUCKET}.${process.env.OSS_ENDPOINT}/`, '');
      await this.client.delete(key);
    } catch (error) {
      this.logger.error(`文件删除失败: ${error}`);
    }
  }
}
