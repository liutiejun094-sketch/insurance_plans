import { ApiProperty } from '@nestjs/swagger';

export class PlanDto {
  @ApiProperty({ description: '方案ID' })
  id: string;
  
  @ApiProperty({ description: '方案名称' })
  name: string;
  
  @ApiProperty({ description: '方案内容', required: false })
  content?: string;
  
  @ApiProperty({ description: '输入类型', enum: ['text', 'file'] })
  inputType: string;
  
  @ApiProperty({ description: '文件名', required: false })
  fileName?: string;
}

export class AnalyzeDto {
  @ApiProperty({ description: '方案列表', type: [PlanDto] })
  plans: PlanDto[];
}
