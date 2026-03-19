import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Request,
  Headers,
  RawBodyRequest,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import {
  CreateStripePaymentDto,
  ConfirmPaymentDto,
  WechatPaymentDto,
  RefundDto,
} from './dto/payments.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  // ========== STRIPE ==========

  @Post('stripe/create-intent')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create Stripe payment intent' })
  async createStripePaymentIntent(
    @Request() req: any,
    @Body() dto: CreateStripePaymentDto,
  ) {
    return this.paymentsService.createStripePaymentIntent(req.user.sub, dto);
  }

  @Post('stripe/confirm')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Confirm Stripe payment' })
  async confirmStripePayment(@Body() dto: ConfirmPaymentDto) {
    return this.paymentsService.confirmStripePayment(dto);
  }

  @Post('stripe/webhook')
  @ApiOperation({ summary: 'Handle Stripe webhook' })
  async handleStripeWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ) {
    const body = req.rawBody?.toString() || '';
    return this.paymentsService.handleStripeWebhook(body, signature);
  }

  // ========== WECHAT ==========

  @Post('wechat/create-order')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create WeChat payment order' })
  async createWechatPayment(
    @Request() req: any,
    @Body() dto: WechatPaymentDto,
  ) {
    return this.paymentsService.createWechatPayment(req.user.sub, dto);
  }

  @Post('wechat/notify')
  @ApiOperation({ summary: 'Handle WeChat payment callback' })
  async handleWechatNotify(
    @Body()
    data: {
      orderId: string;
      transactionId: string;
      result: string;
    },
  ) {
    return this.paymentsService.handleWechatNotify(
      data.orderId,
      data.transactionId,
      data.result,
    );
  }

  // ========== REFUNDS ==========

  @Post('refund')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Request refund' })
  async refundPayment(@Request() req: any, @Body() dto: RefundDto) {
    return this.paymentsService.refundPayment(req.user.sub, dto);
  }

  // ========== QUERIES ==========

  @Get(':orderId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get payment by order ID' })
  async getPaymentByOrderId(@Body() dto: { orderId: string }) {
    return this.paymentsService.getPaymentByOrderId(dto.orderId);
  }
}
