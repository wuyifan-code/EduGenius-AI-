import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateOrderDto, UpdateOrderDto, CancelOrderDto, RefundOrderDto } from './dto/orders.dto';
import { OrderStatus, Prisma } from '@prisma/client';

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

  // 生成订单号
  private generateOrderNo(): string {
    const date = new Date();
    const dateStr = date.getFullYear().toString() +
      String(date.getMonth() + 1).padStart(2, '0') +
      String(date.getDate()).padStart(2, '0');
    const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `MM${dateStr}${randomStr}`;
  }

  // 计算优惠券折扣
  private calculateCouponDiscount(couponCode: string | undefined): number {
    if (!couponCode) return 0;
    
    const coupons: Record<string, number> = {
      'MEDIMATE10': 10,
      'WELCOME20': 20,
      'NEWUSER50': 50,
    };
    
    return coupons[couponCode.toUpperCase()] || 0;
  }

  // 创建订单
  async create(patientId: string, dto: CreateOrderDto) {
    // 计算总价
    const duration = dto.duration || 1;
    const serviceTotal = dto.price * duration;
    const platformFee = dto.platformFee || 10;
    const couponDiscount = this.calculateCouponDiscount(dto.couponCode);
    const totalAmount = Math.max(0, serviceTotal + platformFee - couponDiscount);

    // 生成订单号
    const orderNo = this.generateOrderNo();

    // 使用事务确保数据一致性
    const result = await this.prisma.$transaction(async (tx) => {
      // 创建订单
      const order = await tx.order.create({
        data: {
          orderNo,
          patientId,
          escortId: dto.escortId,
          hospitalId: dto.hospitalId,
          serviceId: dto.serviceId,
          serviceType: dto.serviceType,
          status: OrderStatus.PENDING,
          price: dto.price,
          duration,
          couponCode: dto.couponCode,
          couponDiscount,
          platformFee,
          totalAmount,
          paymentStatus: 'PENDING' as any,
          appointmentDate: dto.appointmentDate ? new Date(dto.appointmentDate) : null,
          appointmentTime: dto.appointmentTime,
          notes: dto.notes,
        },
        include: {
          hospital: true,
          service: true,
          patient: {
            include: { profile: true },
          },
          escort: {
            include: { profile: true, escortProfile: true },
          },
        },
      });

      // 创建订单状态历史
      await tx.orderStatusHistory.create({
        data: {
          orderId: order.id,
          status: OrderStatus.PENDING,
          createdBy: patientId,
          note: '订单创建成功',
        },
      });

      // 创建通知给陪诊师
      await tx.notification.create({
        data: {
          userId: dto.escortId,
          type: 'ORDER_STATUS',
          title: '新订单提醒',
          content: '您有一个新的预约订单，请尽快处理',
          data: { orderId: order.id, orderNo: order.orderNo },
        },
      });

      return order;
    });

    return result;
  }

  // 创建订单状态历史
  private async createStatusHistory(
    orderId: string, 
    status: OrderStatus, 
    createdBy?: string, 
    note?: string
  ) {
    return this.prisma.orderStatusHistory.create({
      data: {
        orderId,
        status,
        createdBy,
        note,
      },
    });
  }

  // 创建通知
  private async createNotification(
    userId: string,
    type: string,
    title: string,
    content: string,
    data?: any
  ) {
    return this.prisma.notification.create({
      data: {
        userId,
        type,
        title,
        content,
        data: data || {},
      },
    });
  }

  // 获取患者订单列表
  async findByPatient(patientId: string, query?: { status?: string; page?: number; limit?: number }) {
    const page = query?.page || 1;
    const limit = query?.limit || 20;
    const skip = (page - 1) * limit;

    const where: Prisma.OrderWhereInput = { patientId };
    if (query?.status) {
      where.status = query.status as OrderStatus;
    }

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        include: {
          hospital: true,
          service: true,
          escort: {
            include: { profile: true, escortProfile: true },
          },
          payment: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      data: orders,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // 获取陪诊师订单列表
  async findByEscort(escortId: string, query?: { status?: string; page?: number; limit?: number }) {
    const page = query?.page || 1;
    const limit = query?.limit || 20;
    const skip = (page - 1) * limit;

    const where: Prisma.OrderWhereInput = {
      OR: [
        { escortId },
        { status: OrderStatus.PENDING }, // 可接单的订单
      ],
    };
    
    if (query?.status) {
      where.status = query.status as OrderStatus;
      delete where.OR; // 如果指定了状态，不使用 OR 查询
      where.escortId = escortId;
    }

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        include: {
          hospital: true,
          service: true,
          patient: {
            include: { profile: true },
          },
          payment: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      data: orders,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // 获取订单详情
  async findById(orderId: string, userId: string, role: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        hospital: true,
        service: true,
        patient: {
          include: { profile: true },
        },
        escort: {
          include: { profile: true, escortProfile: true },
        },
        payment: true,
        reviews: true,
        statusHistory: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('订单不存在');
    }

    // 检查访问权限
    if (role === 'PATIENT' && order.patientId !== userId) {
      throw new ForbiddenException('无权访问此订单');
    }
    if (role === 'ESCORT' && order.escortId && order.escortId !== userId) {
      throw new ForbiddenException('无权访问此订单');
    }

    return order;
  }

  // 接单
  async acceptOrder(orderId: string, escortId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException('订单不存在');
    }

    if (order.status !== OrderStatus.PENDING && order.status !== OrderStatus.PAID) {
      throw new BadRequestException('订单状态不允许接单');
    }

    if (order.escortId && order.escortId !== escortId) {
      throw new ForbiddenException('订单已被其他陪诊师接单');
    }

    const updatedOrder = await this.prisma.order.update({
      where: { id: orderId },
      data: {
        escortId,
        status: OrderStatus.CONFIRMED,
      },
      include: {
        hospital: true,
        service: true,
        patient: {
          include: { profile: true },
        },
        escort: {
          include: { profile: true },
        },
      },
    });

    // 记录状态历史
    await this.createStatusHistory(orderId, OrderStatus.CONFIRMED, escortId, '陪诊师已接单');

    // 通知患者
    await this.createNotification(
      order.patientId,
      'ORDER_STATUS',
      '订单已确认',
      '陪诊师已接受您的订单',
      { orderId: order.id, orderNo: order.orderNo }
    );

    return updatedOrder;
  }

  // 更新订单状态
  async updateStatus(orderId: string, userId: string, status: OrderStatus, note?: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException('订单不存在');
    }

    // 检查权限
    const isPatient = order.patientId === userId;
    const isEscort = order.escortId === userId;

    if (!isPatient && !isEscort) {
      throw new ForbiddenException('无权操作此订单');
    }

    // 状态流转验证
    const validTransitions = this.getValidTransitions(order.status, isPatient, isEscort);
    if (!validTransitions.includes(status)) {
      throw new BadRequestException(`无法从 ${order.status} 状态变更为 ${status} 状态`);
    }

    const updatedOrder = await this.prisma.order.update({
      where: { id: orderId },
      data: { status },
      include: {
        hospital: true,
        service: true,
        patient: {
          include: { profile: true },
        },
        escort: {
          include: { profile: true },
        },
      },
    });

    // 记录状态历史
    await this.createStatusHistory(orderId, status, userId, note);

    // 发送通知
    const notifyUserId = isPatient ? order.escortId : order.patientId;
    if (notifyUserId) {
      await this.createNotification(
        notifyUserId,
        'ORDER_STATUS',
        '订单状态更新',
        `订单状态已更新为: ${this.getStatusLabel(status)}`,
        { orderId: order.id, orderNo: order.orderNo, status }
      );
    }

    return updatedOrder;
  }

  // 取消订单
  async cancelOrder(orderId: string, userId: string, dto?: CancelOrderDto) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException('订单不存在');
    }

    // 只有患者可以取消自己的订单
    if (order.patientId !== userId) {
      throw new ForbiddenException('无权取消此订单');
    }

    // 只能取消待支付或已支付的订单
    if (order.status !== OrderStatus.PENDING && order.status !== OrderStatus.PAID) {
      throw new BadRequestException('当前订单状态不允许取消');
    }

    const updatedOrder = await this.prisma.order.update({
      where: { id: orderId },
      data: { status: OrderStatus.CANCELLED },
      include: {
        hospital: true,
        service: true,
        patient: {
          include: { profile: true },
        },
        escort: {
          include: { profile: true },
        },
      },
    });

    // 记录状态历史
    await this.createStatusHistory(orderId, OrderStatus.CANCELLED, userId, dto?.reason || '用户取消订单');

    // 通知陪诊师（如果已分配）
    if (order.escortId) {
      await this.createNotification(
        order.escortId,
        'ORDER_STATUS',
        '订单已取消',
        '患者已取消订单',
        { orderId: order.id, orderNo: order.orderNo }
      );
    }

    return updatedOrder;
  }

  // 申请退款
  async requestRefund(orderId: string, userId: string, dto: RefundOrderDto) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { payment: true },
    });

    if (!order) {
      throw new NotFoundException('订单不存在');
    }

    if (order.patientId !== userId) {
      throw new ForbiddenException('无权申请退款');
    }

    // 只能对已支付或已确认的订单申请退款
    if (order.status !== OrderStatus.PAID && order.status !== OrderStatus.CONFIRMED) {
      throw new BadRequestException('当前订单状态不允许退款');
    }

    // 更新订单状态为退款中
    const updatedOrder = await this.prisma.order.update({
      where: { id: orderId },
      data: { status: OrderStatus.REFUNDING },
      include: {
        hospital: true,
        service: true,
        patient: {
          include: { profile: true },
        },
        escort: {
          include: { profile: true },
        },
        payment: true,
      },
    });

    // 记录状态历史
    await this.createStatusHistory(orderId, OrderStatus.REFUNDING, userId, `申请退款: ${dto.reason || '用户申请退款'}`);

    // 更新支付记录状态
    if (order.payment) {
      await this.prisma.payment.update({
        where: { id: order.payment.id },
        data: { status: 'REFUNDED' as any },
      });
    }

    return updatedOrder;
  }

  // 开始服务
  async startService(orderId: string, escortId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException('订单不存在');
    }

    if (order.escortId !== escortId) {
      throw new ForbiddenException('无权操作此订单');
    }

    if (order.status !== OrderStatus.CONFIRMED) {
      throw new BadRequestException('订单状态不允许开始服务');
    }

    const updatedOrder = await this.prisma.order.update({
      where: { id: orderId },
      data: { status: OrderStatus.IN_PROGRESS },
      include: {
        hospital: true,
        service: true,
        patient: {
          include: { profile: true },
        },
        escort: {
          include: { profile: true },
        },
      },
    });

    // 记录状态历史
    await this.createStatusHistory(orderId, OrderStatus.IN_PROGRESS, escortId, '陪诊师开始服务');

    // 通知患者
    await this.createNotification(
      order.patientId,
      'ORDER_STATUS',
      '服务已开始',
      '陪诊师已开始为您服务',
      { orderId: order.id, orderNo: order.orderNo }
    );

    return updatedOrder;
  }

  // 完成服务
  async completeService(orderId: string, escortId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException('订单不存在');
    }

    if (order.escortId !== escortId) {
      throw new ForbiddenException('无权操作此订单');
    }

    if (order.status !== OrderStatus.IN_PROGRESS) {
      throw new BadRequestException('订单状态不允许完成服务');
    }

    const updatedOrder = await this.prisma.order.update({
      where: { id: orderId },
      data: { status: OrderStatus.COMPLETED },
      include: {
        hospital: true,
        service: true,
        patient: {
          include: { profile: true },
        },
        escort: {
          include: { profile: true },
        },
      },
    });

    // 记录状态历史
    await this.createStatusHistory(orderId, OrderStatus.COMPLETED, escortId, '服务已完成');

    // 通知患者
    await this.createNotification(
      order.patientId,
      'ORDER_STATUS',
      '服务已完成',
      '陪诊服务已完成，请对服务进行评价',
      { orderId: order.id, orderNo: order.orderNo }
    );

    return updatedOrder;
  }

  // 获取有效的状态流转
  private getValidTransitions(currentStatus: OrderStatus, isPatient: boolean, isEscort: boolean): OrderStatus[] {
    const transitions: Record<OrderStatus, OrderStatus[]> = {
      [OrderStatus.PENDING]: isPatient ? [OrderStatus.CANCELLED] : [],
      [OrderStatus.PAID]: isPatient ? [OrderStatus.CANCELLED, OrderStatus.REFUNDING] : [OrderStatus.CONFIRMED],
      [OrderStatus.CONFIRMED]: isPatient ? [OrderStatus.REFUNDING] : [OrderStatus.MATCHED],
      [OrderStatus.MATCHED]: isEscort ? [OrderStatus.IN_PROGRESS] : [],
      [OrderStatus.IN_PROGRESS]: isEscort ? [OrderStatus.EVIDENCE_COLLECTING] : [],
      [OrderStatus.EVIDENCE_COLLECTING]: isEscort ? [OrderStatus.MEMO_GENERATING] : [],
      [OrderStatus.MEMO_GENERATING]: isEscort ? [OrderStatus.COMPLETED] : [],
      [OrderStatus.COMPLETED]: [],
      [OrderStatus.CANCELLED]: [],
      [OrderStatus.REFUNDING]: [],
      [OrderStatus.REFUNDED]: [],
    };
    return transitions[currentStatus] || [];
  }

  // 获取状态标签
  private getStatusLabel(status: OrderStatus): string {
    const labels: Record<OrderStatus, string> = {
      [OrderStatus.PENDING]: '待支付',
      [OrderStatus.PAID]: '已支付',
      [OrderStatus.CONFIRMED]: '已确认',
      [OrderStatus.MATCHED]: '已匹配',
      [OrderStatus.IN_PROGRESS]: '服务中',
      [OrderStatus.EVIDENCE_COLLECTING]: '取证打卡中',
      [OrderStatus.MEMO_GENERATING]: '报告生成中',
      [OrderStatus.COMPLETED]: '已完成',
      [OrderStatus.CANCELLED]: '已取消',
      [OrderStatus.REFUNDING]: '退款中',
      [OrderStatus.REFUNDED]: '已退款',
    };
    return labels[status] || status;
  }
}
