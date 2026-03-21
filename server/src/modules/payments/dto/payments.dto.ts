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

export class CreateRefundDto {
  @ApiProperty()
  @IsString()
  orderId: string;

  @ApiProperty()
  @IsString()
  reason: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reasonType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  amount?: number;
}

export class ApproveRefundDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  note?: string;
}

export class RejectRefundDto {
  @ApiProperty()
  @IsString()
  reason: string;
}

export class WechatNotifyDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  create_time: string;

  @ApiProperty()
  resource_type: string;

  @ApiProperty()
  event_type: string;

  @ApiProperty()
  summary: string;

  @ApiProperty()
  resource: {
    original_type: string;
    algorithm: string;
    ciphertext: string;
    associated_data: string;
    nonce: string;
  };
}
