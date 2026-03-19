import { IsString, IsNumber, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateStripePaymentDto {
  @ApiProperty()
  @IsString()
  orderId: string;

  @ApiPropertyOptional({ default: 'cny' })
  @IsOptional()
  @IsString()
  currency?: string;
}

export class ConfirmPaymentDto {
  @ApiProperty()
  @IsString()
  paymentIntentId: string;
}

export class WechatPaymentDto {
  @ApiProperty()
  @IsString()
  orderId: string;
}

export class RefundDto {
  @ApiProperty()
  @IsString()
  paymentId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  amount?: number;
}
