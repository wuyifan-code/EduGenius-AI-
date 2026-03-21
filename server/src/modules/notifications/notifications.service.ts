import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export enum NotificationType {
  ORDER = 'ORDER',
  ORDER_STATUS = 'ORDER_STATUS',
  MESSAGE = 'MESSAGE',
  REVIEW = 'REVIEW',
  SYSTEM = 'SYSTEM',
  PAYMENT = 'PAYMENT',
  REFUND = 'REFUND',
}

// 通知优先级
export enum NotificationPriority {
  HIGH = 'HIGH',
  NORMAL = 'NORMAL',
  LOW = 'LOW',
}

export interface CreateNotificationDto {
  userId: string;
  type: NotificationType;
  title: string;
  content: string;
  data?: any;
  priority?: NotificationPriority;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  
  constructor(private prisma: PrismaService) {}

  async create(userId: string, type: NotificationType, title: string, content: string, data?: any) {
    try {
      const notification = await this.prisma.notification.create({
        data: {
          userId,
          type,
          title,
          content,
          data: data || {},
        },
      });
      
      this.logger.log(`Notification created: ${type} for user ${userId}`);
      return notification;
    } catch (error) {
      this.logger.error('Failed to create notification:', error);
      return null;
    }
  }

  // 批量创建通知
  async createBatch(notifications: CreateNotificationDto[]) {
    try {
      const result = await this.prisma.notification.createMany({
        data: notifications.map(n => ({
          userId: n.userId,
          type: n.type,
          title: n.title,
          content: n.content,
          data: n.data || {},
        })),
      });
      
      this.logger.log(`Batch notifications created: ${result.count}`);
      return result;
    } catch (error) {
      this.logger.error('Failed to create batch notifications:', error);
      return null;
    }
  }

  async getByUser(userId: string, page = 1, limit = 20, unreadOnly = false, type?: string) {
    const where: any = { userId };
    if (unreadOnly) {
      where.isRead = false;
    }
    if (type) {
      where.type = type;
    }

    const [notifications, total, unreadCount] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.notification.count({ where }),
      this.prisma.notification.count({ where: { userId, isRead: false } }),
    ]);

    return {
      success: true,
      data: {
        notifications,
        unreadCount,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    };
  }

  async markAsRead(notificationId: string, userId: string) {
    const notification = await this.prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification || notification.userId !== userId) {
      return null;
    }

    return this.prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });
  }

  async markAllAsRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }

  async delete(notificationId: string, userId: string) {
    const notification = await this.prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification || notification.userId !== userId) {
      return null;
    }

    return this.prisma.notification.delete({
      where: { id: notificationId },
    });
  }

  // Helper methods to create specific notification types
  
  // 订单相关通知
  async notifyOrderStatus(userId: string, orderId: string, status: string, orderNo?: string) {
    const statusMessages: Record<string, { title: string; content: string }> = {
      PENDING: { title: '订单已创建', content: '您的订单已创建，请尽快完成支付' },
      PAID: { title: '订单已支付', content: '您的订单已支付成功，等待陪诊师接单' },
      CONFIRMED: { title: '订单已确认', content: '陪诊师已接单，即将为您服务' },
      MATCHED: { title: '已匹配陪诊师', content: '已为您匹配陪诊师，请查看订单详情' },
      IN_PROGRESS: { title: '服务进行中', content: '陪诊服务已开始，祝您就医顺利' },
      COMPLETED: { title: '服务已完成', content: '陪诊服务已完成，欢迎您进行评价' },
      CANCELLED: { title: '订单已取消', content: '您的订单已取消，如有疑问请联系客服' },
      REFUNDING: { title: '退款申请中', content: '您的退款申请已提交，正在审核中' },
      REFUNDED: { title: '退款已完成', content: '您的退款已处理完成，款项将原路退回' },
    };

    const msg = statusMessages[status] || { title: '订单状态更新', content: `您的订单状态已更新为: ${status}` };

    return this.create(userId, NotificationType.ORDER_STATUS, msg.title, msg.content, { 
      orderId, 
      status,
      orderNo: orderNo || orderId,
    });
  }

  // 订单创建通知 - 通知患者和陪诊师
  async notifyOrderCreated(patientId: string, escortId: string | null, orderId: string, orderNo: string) {
    const notifications: CreateNotificationDto[] = [
      {
        userId: patientId,
        type: NotificationType.ORDER,
        title: '订单创建成功',
        content: `您的订单 ${orderNo} 已创建，请尽快完成支付`,
        data: { orderId, orderNo, type: 'created' },
      },
    ];

    if (escortId) {
      notifications.push({
        userId: escortId,
        type: NotificationType.ORDER,
        title: '新订单提醒',
        content: `您有一个新的预约订单 ${orderNo}，请尽快处理`,
        data: { orderId, orderNo, type: 'new_order' },
      });
    }

    return this.createBatch(notifications);
  }

  // 支付成功通知
  async notifyPaymentSuccess(userId: string, orderId: string, orderNo: string, amount: number) {
    return this.create(
      userId,
      NotificationType.PAYMENT,
      '支付成功',
      `您的订单 ${orderNo} 支付成功，金额 ¥${amount.toFixed(2)}`,
      { orderId, orderNo, amount, type: 'payment_success' },
    );
  }

  // 支付失败通知
  async notifyPaymentFailed(userId: string, orderId: string, orderNo: string, reason?: string) {
    return this.create(
      userId,
      NotificationType.PAYMENT,
      '支付失败',
      `您的订单 ${orderNo} 支付失败${reason ? '：' + reason : ''}，请重试`,
      { orderId, orderNo, type: 'payment_failed', reason },
    );
  }

  // 新消息通知
  async notifyNewMessage(userId: string, senderName: string, messagePreview: string, messageId: string, senderId: string) {
    return this.create(
      userId,
      NotificationType.MESSAGE,
      '新消息',
      `${senderName}: ${messagePreview.slice(0, 50)}${messagePreview.length > 50 ? '...' : ''}`,
      { messageId, senderId, senderName },
    );
  }

  // 新评价通知
  async notifyNewReview(userId: string, rating: number, reviewerName?: string, orderId?: string) {
    return this.create(
      userId,
      NotificationType.REVIEW,
      '新评价',
      reviewerName 
        ? `${reviewerName} 给您了一个 ${rating} 星评价`
        : `您收到了一个 ${rating} 星评价`,
      { rating, reviewerName, orderId },
    );
  }

  // 退款相关通知
  async notifyRefundStatus(userId: string, orderId: string, orderNo: string, status: string, amount?: number, reason?: string) {
    const statusMessages: Record<string, { title: string; content: string }> = {
      PENDING: { title: '退款申请已提交', content: `您的订单 ${orderNo} 退款申请已提交，等待审核` },
      APPROVED: { title: '退款申请已通过', content: `您的订单 ${orderNo} 退款申请已通过，款项将原路退回` },
      REJECTED: { title: '退款申请被拒绝', content: `您的订单 ${orderNo} 退款申请被拒绝${reason ? '：' + reason : ''}` },
      COMPLETED: { title: '退款已完成', content: `您的订单 ${orderNo} 退款已完成，金额 ¥${amount?.toFixed(2) || ''}` },
    };

    const msg = statusMessages[status] || { title: '退款状态更新', content: `您的退款申请状态已更新为: ${status}` };

    return this.create(userId, NotificationType.REFUND, msg.title, msg.content, { 
      orderId, 
      orderNo, 
      status,
      amount,
      reason,
    });
  }

  // 系统公告通知
  async notifySystemAnnouncement(userId: string, title: string, content: string, data?: any) {
    return this.create(
      userId,
      NotificationType.SYSTEM,
      title,
      content,
      { ...data, type: 'system_announcement' },
    );
  }

  // 批量发送系统公告
  async broadcastSystemAnnouncement(userIds: string[], title: string, content: string, data?: any) {
    const notifications = userIds.map(userId => ({
      userId,
      type: NotificationType.SYSTEM,
      title,
      content,
      data: { ...data, type: 'system_announcement' },
    }));

    return this.createBatch(notifications);
  }

  // 获取未读通知数量
  async getUnreadCount(userId: string): Promise<number> {
    return this.prisma.notification.count({
      where: { userId, isRead: false },
    });
  }

  // 获取通知统计
  async getStats(userId: string) {
    const [total, unread, byType] = await Promise.all([
      this.prisma.notification.count({ where: { userId } }),
      this.prisma.notification.count({ where: { userId, isRead: false } }),
      this.prisma.notification.groupBy({
        by: ['type'],
        where: { userId, isRead: false },
        _count: { type: true },
      }),
    ]);

    const typeCount: Record<string, number> = {};
    byType.forEach(item => {
      typeCount[item.type] = item._count.type;
    });

    return { total, unread, byType: typeCount };
  }
}
