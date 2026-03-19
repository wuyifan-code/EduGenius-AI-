import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateStripePaymentDto, ConfirmPaymentDto, WechatPaymentDto, RefundDto } from './dto/payments.dto';
import Stripe from 'stripe';

@Injectable()
export class PaymentsService {
  private stripe: Stripe;

  constructor(private prisma: PrismaService) {
    // Initialize Stripe (will be used when API key is configured)
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder', {
      apiVersion: '2023-10-16',
    });
  }

  // ========== STRIPE PAYMENTS ==========

  async createStripePaymentIntent(userId: string, dto: CreateStripePaymentDto) {
    const order = await this.prisma.order.findUnique({
      where: { id: dto.orderId },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.patientId !== userId) {
      throw new BadRequestException('You can only pay for your own orders');
    }

    if (order.paymentStatus === 'COMPLETED') {
      throw new BadRequestException('Order is already paid');
    }

    // Create Stripe PaymentIntent
    const paymentIntent = await this.stripe.paymentIntents.create({
      amount: Math.round(order.price * 100), // Convert to cents
      currency: dto.currency || 'cny',
      metadata: {
        orderId: dto.orderId,
        userId,
      },
    });

    // Create payment record
    await this.prisma.payment.create({
      data: {
        orderId: dto.orderId,
        userId,
        amount: order.price * 100,
        currency: dto.currency || 'cny',
        method: 'STRIPE',
        status: 'PENDING',
        stripePaymentIntentId: paymentIntent.id,
      },
    });

    return {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    };
  }

  async confirmStripePayment(dto: ConfirmPaymentDto) {
    const payment = await this.prisma.payment.findUnique({
      where: { stripePaymentIntentId: dto.paymentIntentId },
      include: { order: true },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    // Update payment status
    await this.prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: 'COMPLETED',
        paidAt: new Date(),
      },
    });

    // Update order payment status
    await this.prisma.order.update({
      where: { id: payment.orderId },
      data: {
        paymentStatus: 'COMPLETED',
        status: 'CONFIRMED',
      },
    });

    return { success: true, orderId: payment.orderId };
  }

  async handleStripeWebhook(body: any, signature: string) {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      throw new BadRequestException('Webhook secret not configured');
    }

    try {
      const event = this.stripe.webhooks.constructEvent(
        body,
        signature,
        webhookSecret,
      );

      switch (event.type) {
        case 'payment_intent.succeeded':
          const paymentIntent = event.data.object as Stripe.PaymentIntent;
          const orderId = paymentIntent.metadata?.orderId;

          if (orderId) {
            // Update payment record
            await this.prisma.payment.updateMany({
              where: { stripePaymentIntentId: paymentIntent.id },
              data: { status: 'COMPLETED', paidAt: new Date() },
            });

            // Update order status
            await this.prisma.order.update({
              where: { id: orderId },
              data: { paymentStatus: 'COMPLETED', status: 'CONFIRMED' },
            });
          }
          break;

        case 'payment_intent.payment_failed':
          const failedIntent = event.data.object as Stripe.PaymentIntent;
          await this.prisma.payment.update({
            where: { stripePaymentIntentId: failedIntent.id },
            data: { status: 'FAILED' },
          });
          break;
      }

      return { received: true };
    } catch (err) {
      throw new BadRequestException(`Webhook Error: ${err.message}`);
    }
  }

  // ========== WECHAT PAYMENTS ==========

  async createWechatPayment(userId: string, dto: WechatPaymentDto) {
    const order = await this.prisma.order.findUnique({
      where: { id: dto.orderId },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.patientId !== userId) {
      throw new BadRequestException('You can only pay for your own orders');
    }

    // Generate unique out_trade_no
    const outTradeNo = `MM${Date.now()}${Math.random().toString(36).substring(2, 8)}`;

    // In production, this would call WeChat Pay API
    // For now, we'll create a mock response
    const wechatOrderId = `WX${outTradeNo}`;

    // Create payment record
    await this.prisma.payment.create({
      data: {
        orderId: dto.orderId,
        userId,
        amount: order.price * 100,
        currency: 'cny',
        method: 'WECHAT',
        status: 'PENDING',
        wechatOrderId,
      },
    });

    return {
      wechatOrderId,
      qrCodeUrl: `weixin://wxpay/bizpayurl?pr=${wechatOrderId}`,
    };
  }

  async handleWechatNotify(orderId: string, transactionId: string, result: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { orderId },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    if (result === 'SUCCESS') {
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'COMPLETED',
          paidAt: new Date(),
        },
      });

      await this.prisma.order.update({
        where: { id: orderId },
        data: {
          paymentStatus: 'COMPLETED',
          status: 'CONFIRMED',
        },
      });
    }

    return { success: true };
  }

  // ========== REFUNDS ==========

  async refundPayment(userId: string, dto: RefundDto) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: dto.paymentId },
      include: { order: true },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    // Only allow refund for paid payments
    if (payment.status !== 'COMPLETED') {
      throw new BadRequestException('Can only refund paid payments');
    }

    // Check if order belongs to user (patient can request refund)
    if (payment.order.patientId !== userId) {
      throw new BadRequestException('You can only refund your own payments');
    }

    // Process refund based on payment method
    if (payment.method === 'STRIPE' && payment.stripePaymentIntentId) {
      await this.stripe.refunds.create({
        payment_intent: payment.stripePaymentIntentId,
        amount: Math.round(payment.amount),
      });
    }

    // In production, WeChat Pay refund API would be called here

    // Update payment status
    await this.prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: 'REFUNDED',
        refundedAt: new Date(),
      },
    });

    // Update order status
    await this.prisma.order.update({
      where: { id: payment.orderId },
      data: {
        paymentStatus: 'REFUNDED',
        status: 'CANCELLED',
      },
    });

    return { success: true, refundedAmount: payment.amount / 100 };
  }

  // ========== QUERIES ==========

  async getPaymentByOrderId(orderId: string) {
    return this.prisma.payment.findUnique({
      where: { orderId },
    });
  }
}
