import { ApiProperty } from '@nestjs/swagger';
import { InputType } from '../../types';

export class CreatePlanDto {
  @ApiProperty({ description: '方案名称' })
  name: string;

  @ApiProperty({ description: '输入类型', enum: ['text', 'file', 'image'] })
  inputType: InputType;

  @ApiProperty({ description: '文本内容', required: false })
  content?: string;

  @ApiProperty({ description: '文件信息', required: false })
  fileInfo?: {
    name: string;
    size: number;
    type: string;
    url: string;
  };

  @ApiProperty({ description: '图片URL列表', required: false })
  images?: string[];
}
