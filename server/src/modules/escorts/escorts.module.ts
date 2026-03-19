import { Module } from '@nestjs/common';
import { EscortsService } from './escorts.service';
import { EscortsController } from './escorts.controller';

@Module({
  controllers: [EscortsController],
  providers: [EscortsService],
  exports: [EscortsService],
})
export class EscortsModule {}
