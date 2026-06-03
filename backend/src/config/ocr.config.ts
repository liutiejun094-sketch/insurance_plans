import * as dotenv from 'dotenv';
dotenv.config();

export const OCR_CONFIG = {
  accessKeyId: process.env.ALIYUN_ACCESS_KEY_ID || '',
  accessKeySecret: process.env.ALIYUN_ACCESS_KEY_SECRET || '',
  endpoint: 'https://ocr.cn-hangzhou.aliyuncs.com',
  apiVersion: '2019-12-30',
};
