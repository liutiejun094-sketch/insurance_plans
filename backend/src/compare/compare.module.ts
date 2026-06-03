import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CompareService } from './compare.service';
import { CompareResult, CompareResultSchema } from './schemas/compare-result.schema';

@Module({
  imports: [MongooseModule.forFeature([
    { name: CompareResult.name, schema: CompareResultSchema }
  ])],
  providers: [CompareService],
  exports: [CompareService],
})
export class CompareModule {}
