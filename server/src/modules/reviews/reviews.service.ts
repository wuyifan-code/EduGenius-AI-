import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ReviewsService {
  constructor(private prisma: PrismaService) {}

  async create(orderId: string, authorId: string, targetId: string, rating: number, comment?: string) {
    // Verify order exists and is completed
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.status !== 'COMPLETED') {
      throw new ForbiddenException('Can only review completed orders');
    }

    // Create review
    const review = await this.prisma.review.create({
      data: {
        orderId,
        authorId,
        targetId,
        rating,
        comment,
      },
      include: {
        author: { include: { profile: true } },
        target: { include: { profile: true } },
        order: true,
      },
    });

    // Update escort profile rating
    await this.updateEscortRating(targetId);

    return review;
  }

  async getByOrder(orderId: string) {
    return this.prisma.review.findMany({
      where: { orderId },
      include: {
        author: { include: { profile: true } },
        target: { include: { profile: true } },
      },
    });
  }

  async getByTarget(targetId: string, page = 1, limit = 20) {
    const [reviews, total] = await Promise.all([
      this.prisma.review.findMany({
        where: { targetId },
        include: {
          author: { include: { profile: true } },
          order: true,
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.review.count({ where: { targetId } }),
    ]);

    // Calculate average rating
    const avgRating = await this.prisma.review.aggregate({
      where: { targetId },
      _avg: { rating: true },
    });

    return {
      reviews,
      averageRating: avgRating._avg.rating || 0,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getByAuthor(authorId: string, page = 1, limit = 20) {
    const [reviews, total] = await Promise.all([
      this.prisma.review.findMany({
        where: { authorId },
        include: {
          target: { include: { profile: true } },
          order: true,
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.review.count({ where: { authorId } }),
    ]);

    return {
      reviews,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  private async updateEscortRating(escortId: string) {
    const result = await this.prisma.review.aggregate({
      where: { targetId: escortId },
      _avg: { rating: true },
      _count: true,
    });

    await this.prisma.escortProfile.updateMany({
      where: { userId: escortId },
      data: {
        rating: result._avg.rating || 0,
      },
    });
  }

  async checkCanReview(orderId: string, userId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order || order.status !== 'COMPLETED') {
      return { canReview: false, reason: 'Order not completed' };
    }

    if (order.patientId !== userId) {
      return { canReview: false, reason: 'Not the patient' };
    }

    const existingReview = await this.prisma.review.findFirst({
      where: {
        orderId,
        authorId: userId,
      },
    });

    if (existingReview) {
      return { canReview: false, reason: 'Already reviewed' };
    }

    return { canReview: true, targetId: order.escortId };
  }
}
