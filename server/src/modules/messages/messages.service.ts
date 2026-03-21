import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { MessageType } from '@prisma/client';

export interface SendMessageDto {
  receiverId: string;
  content: string;
  orderId?: string;
  type?: MessageType;
  imageUrl?: string;
}

// 通知类型枚举
export enum NotificationType {
  ORDER_STATUS = 'ORDER_STATUS',
  MESSAGE = 'MESSAGE',
  REVIEW = 'REVIEW',
  SYSTEM = 'SYSTEM',
  PAYMENT = 'PAYMENT',
  REFUND = 'REFUND',
}

export interface Conversation {
  partnerId: string;
  partner: {
    id: string;
    email: string;
    profile: {
      name: string | null;
      avatarUrl: string | null;
    } | null;
  };
  lastMessage: {
    id: string;
    content: string;
    type: MessageType;
    imageUrl: string | null;
    createdAt: Date;
    isRead: boolean;
    senderId: string;
  };
  unreadCount: number;
  updatedAt: Date;
}

@Injectable()
export class MessagesService {
  constructor(private prisma: PrismaService) {}

  // 创建通知
  private async createNotification(
    userId: string,
    type: NotificationType,
    title: string,
    content: string,
    data?: any,
  ) {
    try {
      return await this.prisma.notification.create({
        data: {
          userId,
          type,
          title,
          content,
          data: data || {},
        },
      });
    } catch (error) {
      console.error('Failed to create notification:', error);
      return null;
    }
  }

  async findConversation(userId1: string, userId2: string, page = 1, limit = 50) {
    const skip = (page - 1) * limit;

    const messages = await this.prisma.message.findMany({
      where: {
        OR: [
          { senderId: userId1, receiverId: userId2 },
          { senderId: userId2, receiverId: userId1 },
        ],
      },
      include: {
        sender: {
          select: {
            id: true,
            email: true,
            profile: {
              select: {
                name: true,
                avatarUrl: true,
              },
            },
          },
        },
        receiver: {
          select: {
            id: true,
            email: true,
            profile: {
              select: {
                name: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    });

    // Return in ascending order for display
    return messages.reverse();
  }

  async send(senderId: string, data: SendMessageDto) {
    const { receiverId, content, orderId, type = MessageType.TEXT, imageUrl } = data;

    // Verify receiver exists
    const receiver = await this.prisma.user.findUnique({
      where: { id: receiverId },
    });

    if (!receiver) {
      throw new NotFoundException('Receiver not found');
    }

    // Create message
    const message = await this.prisma.message.create({
      data: {
        senderId,
        receiverId,
        content,
        orderId,
        type,
        imageUrl,
      },
      include: {
        sender: {
          select: {
            id: true,
            email: true,
            profile: {
              select: {
                name: true,
                avatarUrl: true,
              },
            },
          },
        },
        receiver: {
          select: {
            id: true,
            email: true,
            profile: {
              select: {
                name: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });

    // 创建新消息通知
    const senderName = message.sender.profile?.name || message.sender.email;
    const contentPreview = type === MessageType.IMAGE ? '[图片]' : content.slice(0, 50);
    await this.createNotification(
      receiverId,
      NotificationType.MESSAGE,
      '新消息',
      `${senderName}: ${contentPreview}${content.length > 50 ? '...' : ''}`,
      {
        messageId: message.id,
        senderId,
        senderName,
        orderId,
        type,
      },
    );

    return message;
  }

  async markAsRead(messageId: string, userId: string) {
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    // Only receiver can mark as read
    if (message.receiverId !== userId) {
      throw new NotFoundException('Unauthorized');
    }

    return this.prisma.message.update({
      where: { id: messageId },
      data: { isRead: true },
    });
  }

  async markConversationAsRead(userId: string, partnerId: string) {
    // Mark all messages from partner to user as read
    const result = await this.prisma.message.updateMany({
      where: {
        senderId: partnerId,
        receiverId: userId,
        isRead: false,
      },
      data: { isRead: true },
    });

    return { updatedCount: result.count };
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.prisma.message.count({
      where: {
        receiverId: userId,
        isRead: false,
      },
    });
  }

  async getConversations(userId: string): Promise<Conversation[]> {
    // Get all messages where user is either sender or receiver
    const messages = await this.prisma.message.findMany({
      where: {
        OR: [{ senderId: userId }, { receiverId: userId }],
      },
      include: {
        sender: {
          select: {
            id: true,
            email: true,
            profile: {
              select: {
                name: true,
                avatarUrl: true,
              },
            },
          },
        },
        receiver: {
          select: {
            id: true,
            email: true,
            profile: {
              select: {
                name: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Group by conversation partner
    const conversationsMap = new Map<string, Conversation>();

    for (const msg of messages) {
      const partnerId = msg.senderId === userId ? msg.receiverId : msg.senderId;
      const partner = msg.senderId === userId ? msg.receiver : msg.sender;

      if (!conversationsMap.has(partnerId)) {
        conversationsMap.set(partnerId, {
          partnerId,
          partner,
          lastMessage: {
            id: msg.id,
            content: msg.content,
            type: msg.type,
            imageUrl: msg.imageUrl,
            createdAt: msg.createdAt,
            isRead: msg.isRead,
            senderId: msg.senderId,
          },
          unreadCount: 0,
          updatedAt: msg.createdAt,
        });
      }

      // Count unread messages
      if (msg.receiverId === userId && !msg.isRead) {
        const conv = conversationsMap.get(partnerId)!;
        conv.unreadCount++;
      }
    }

    // Convert to array and sort by updatedAt
    return Array.from(conversationsMap.values()).sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }

  async searchMessages(userId: string, query: string) {
    const messages = await this.prisma.message.findMany({
      where: {
        OR: [{ senderId: userId }, { receiverId: userId }],
        content: {
          contains: query,
          mode: 'insensitive',
        },
      },
      include: {
        sender: {
          select: {
            id: true,
            email: true,
            profile: {
              select: {
                name: true,
                avatarUrl: true,
              },
            },
          },
        },
        receiver: {
          select: {
            id: true,
            email: true,
            profile: {
              select: {
                name: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return messages;
  }

  async deleteMessage(messageId: string, userId: string) {
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    // Only sender can delete their message
    if (message.senderId !== userId) {
      throw new NotFoundException('Unauthorized');
    }

    return this.prisma.message.delete({
      where: { id: messageId },
    });
  }

  async getMessageById(messageId: string) {
    return this.prisma.message.findUnique({
      where: { id: messageId },
      include: {
        sender: {
          select: {
            id: true,
            email: true,
            profile: {
              select: {
                name: true,
                avatarUrl: true,
              },
            },
          },
        },
        receiver: {
          select: {
            id: true,
            email: true,
            profile: {
              select: {
                name: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });
  }
}
