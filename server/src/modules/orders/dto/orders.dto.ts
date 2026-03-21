import { IsString, IsNumber, IsOptional, IsDateString, IsEnum, IsInt, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ServiceType, OrderStatus } from '@prisma/client';

export class CreateOrderDto {
  @ApiProperty({ description: '陪诊师ID' })
  @IsString()
  escortId: string;

  @ApiPropertyOptional({ description: '医院ID' })
  @IsOptional()
  @IsString()
  hospitalId?: string;

  @ApiPropertyOptional({ description: '服务ID' })
  @IsOptional()
  @IsString()
  serviceId?: string;

  @ApiProperty({ enum: ServiceType, description: '服务类型' })
  @IsEnum(ServiceType)
  serviceType: ServiceType;

  @ApiProperty({ description: '服务价格' })
  @IsNumber()
  price: number;

  @ApiPropertyOptional({ description: '服务时长（小时）', default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(12)
  duration?: number;

  @ApiPropertyOptional({ description: '预约日期' })
  @IsOptional()
  @IsDateString()
  appointmentDate?: string;

  @ApiPropertyOptional({ description: '预约时间' })
  @IsOptional()
  @IsString()
  appointmentTime?: string;

  @ApiPropertyOptional({ description: '备注' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: '优惠券码' })
  @IsOptional()
  @IsString()
  couponCode?: string;

  @ApiPropertyOptional({ description: '平台费', default: 10 })
  @IsOptional()
  @IsNumber()
  platformFee?: number;
}

export class UpdateOrderDto {
  @ApiPropertyOptional({ enum: OrderStatus, description: '订单状态' })
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;

  @ApiPropertyOptional({ description: '备注' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class OrderQueryDto {
  @ApiPropertyOptional({ description: '订单状态' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: '页码', default: 1 })
  @IsOptional()
  @IsInt()
  page?: number;

  @ApiPropertyOptional({ description: '每页数量', default: 20 })
  @IsOptional()
  @IsInt()
  limit?: number;

  @ApiPropertyOptional({ description: '搜索关键词' })
  @IsOptional()
  @IsString()
  search?: string;
}

export class CancelOrderDto {
  @ApiPropertyOptional({ description: '取消原因' })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class RefundOrderDto {
  @ApiProperty({ description: '退款金额' })
  @IsNumber()
  amount: number;

  @ApiPropertyOptional({ description: '退款原因' })
  @IsOptional()
  @IsString()
  reason?: string;
}
