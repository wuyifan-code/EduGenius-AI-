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
  Param,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import {
  CreateStripePaymentDto,
  ConfirmPaymentDto,
  WechatPaymentDto,
  RefundDto,
  CreateRefundDto,
  ApproveRefundDto,
  WechatNotifyDto,
} from './dto/payments.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

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
  async handleWechatNotify(@Body() data: WechatNotifyDto) {
    return this.paymentsService.handleWechatNotify(data);
  }

  @Get('wechat/query/:orderId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Query WeChat payment status' })
  async queryWechatPayment(@Param('orderId') orderId: string) {
    return this.paymentsService.queryWechatPayment(orderId);
  }

  // ========== REFUNDS ==========

  @Post('refunds')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create refund request' })
  async createRefund(@Request() req: any, @Body() dto: CreateRefundDto) {
    return this.paymentsService.createRefund(req.user.sub, dto);
  }

  @Get('refunds/my')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get my refund requests' })
  async getMyRefunds(
    @Request() req: any,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.paymentsService.getUserRefunds(req.user.sub, page, limit);
  }

  @Get('refunds')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all refund requests (Admin)' })
  async getAllRefunds(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('status') status?: string,
  ) {
    return this.paymentsService.getAllRefunds(page, limit, status);
  }

  @Post('refunds/:refundId/approve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Approve refund (Admin)' })
  async approveRefund(
    @Request() req: any,
    @Param('refundId') refundId: string,
    @Body() dto: ApproveRefundDto,
  ) {
    return this.paymentsService.approveRefund(refundId, req.user.sub, dto);
  }

  @Post('refunds/:refundId/reject')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reject refund (Admin)' })
  async rejectRefund(
    @Request() req: any,
    @Param('refundId') refundId: string,
    @Body() dto: ApproveRefundDto,
  ) {
    return this.paymentsService.rejectRefund(refundId, req.user.sub, dto);
  }

  @Get('refunds/:refundId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get refund details' })
  async getRefundById(@Param('refundId') refundId: string) {
    return this.paymentsService.getRefundById(refundId);
  }

  // ========== LEGACY REFUND ==========

  @Post('refund')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Request refund (Legacy)' })
  async refundPayment(@Request() req: any, @Body() dto: RefundDto) {
    return this.paymentsService.refundPayment(req.user.sub, dto);
  }

  // ========== QUERIES ==========

  @Get(':orderId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get payment by order ID' })
  async getPaymentByOrderId(@Param('orderId') orderId: string) {
    return this.paymentsService.getPaymentByOrderId(orderId);
  }
}
