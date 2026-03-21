import { Module } from '@nestjs/common';
import { NarrativeMedicineService } from './narrative-medicine.service';
import { NarrativeMedicineController } from './narrative-medicine.controller';

@Module({
  controllers: [NarrativeMedicineController],
  providers: [NarrativeMedicineService],
  exports: [NarrativeMedicineService],
})
export class NarrativeMedicineModule {}
