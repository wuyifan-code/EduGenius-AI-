import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export enum NotificationType {
  ORDER_STATUS = 'ORDER_STATUS',
  MESSAGE = 'MESSAGE',
  REVIEW = 'REVIEW',
  SYSTEM = 'SYSTEM',
  PAYMENT = 'PAYMENT',
}

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, type: NotificationType, title: string, content: string, data?: any) {
    return this.prisma.notification.create({
      data: {
        userId,
        type,
        title,
        content,
        data,
      },
    });
  }

  async getByUser(userId: string, page = 1, limit = 20, unreadOnly = false) {
    const where: any = { userId };
    if (unreadOnly) {
      where.isRead = false;
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
      notifications,
      unreadCount,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
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
  async notifyOrderStatus(userId: string, orderId: string, status: string) {
    const statusMessages: Record<string, { title: string; content: string }> = {
      CONFIRMED: { title: '订单已确认', content: '您的订单已确认，陪诊师即将为您服务' },
      MATCHED: { title: '已匹配陪诊师', content: '已为您匹配陪诊师，请查看订单详情' },
      IN_PROGRESS: { title: '服务进行中', content: '陪诊服务已开始，祝您就医顺利' },
      COMPLETED: { title: '服务已完成', content: '陪诊服务已完成，欢迎您进行评价' },
      CANCELLED: { title: '订单已取消', content: '您的订单已取消，如有疑问请联系客服' },
    };

    const msg = statusMessages[status] || { title: '订单状态更新', content: `您的订单状态已更新为: ${status}` };

    return this.create(userId, NotificationType.ORDER_STATUS, msg.title, msg.content, { orderId, status });
  }

  async notifyNewMessage(userId: string, senderName: string, messagePreview: string) {
    return this.create(
      userId,
      NotificationType.MESSAGE,
      '新消息',
      `${senderName}: ${messagePreview.slice(0, 50)}...`,
    );
  }

  async notifyNewReview(userId: string, rating: number) {
    return this.create(
      userId,
      NotificationType.REVIEW,
      '新评价',
      `您收到了一个 ${rating} 星评价`,
    );
  }
}
