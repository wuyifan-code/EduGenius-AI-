import { IsString, IsOptional, IsNumber, IsBoolean, IsArray, IsEnum, IsDateString, Min, Max, ArrayMinSize } from 'class-validator';
import { ServiceType } from '@prisma/client';

export class CreateEscortServiceDto {
  @IsEnum(ServiceType)
  serviceType: ServiceType;

  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @Min(1)
  @Max(1000)
  pricePerHour: number;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsArray()
  @ArrayMinSize(1)
  @IsNumber({}, { each: true })
  @Min(1, { each: true })
  @Max(7, { each: true })
  availableWeekdays: number[];

  @IsArray()
  @ArrayMinSize(1)
  timeSlots: { start: string; end: string }[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  hospitalIds?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  areas?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(10)
  maxDailyOrders?: number;
}
