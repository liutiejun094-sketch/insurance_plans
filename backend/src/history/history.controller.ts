import { Controller, Get, Post, Delete, Body, Param, HttpException, HttpStatus } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { HistoryService } from './history.service';

@ApiTags('history')
@Controller('api/history')
export class HistoryController {
  constructor(private readonly historyService: HistoryService) {}

  @Post()
  async create(@Body() body: { title: string; planIds: string[]; resultId: string; count: number }) {
    try {
      const history = await this.historyService.create(
        body.planIds,
        body.resultId,
        body.count,
        body.title
      );
      return { code: 200, data: history };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get()
  async findAll() {
    try {
      const histories = await this.historyService.findAll();
      return { code: 200, data: histories };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    try {
      const history = await this.historyService.findOne(id);
      if (!history) {
        throw new HttpException('记录不存在', HttpStatus.NOT_FOUND);
      }
      return { code: 200, data: history };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    try {
      const history = await this.historyService.remove(id);
      if (!history) {
        throw new HttpException('记录不存在', HttpStatus.NOT_FOUND);
      }
      return { code: 200, data: { message: '删除成功' } };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
