import { Controller, Get, Post, Body, Patch, Param, Delete, HttpException, HttpStatus } from '@nestjs/common';
import { PlanService } from './plan.service';
import { CreatePlanDto } from './dto/create-plan.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('plans')
@Controller('api/plans')
export class PlanController {
  constructor(private readonly planService: PlanService) {}

  @Post()
  async create(@Body() createPlanDto: CreatePlanDto) {
    try {
      const plan = await this.planService.create(createPlanDto);
      return { code: 200, data: plan };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get()
  async findAll() {
    try {
      const plans = await this.planService.findAll();
      return { code: 200, data: plans };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    try {
      const plan = await this.planService.findOne(id);
      if (!plan) {
        throw new HttpException('方案不存在', HttpStatus.NOT_FOUND);
      }
      return { code: 200, data: plan };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updatePlanDto: UpdatePlanDto) {
    try {
      const plan = await this.planService.update(id, updatePlanDto);
      if (!plan) {
        throw new HttpException('方案不存在', HttpStatus.NOT_FOUND);
      }
      return { code: 200, data: plan };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    try {
      const plan = await this.planService.remove(id);
      if (!plan) {
        throw new HttpException('方案不存在', HttpStatus.NOT_FOUND);
      }
      return { code: 200, data: { message: '删除成功' } };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
