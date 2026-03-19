import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma, UserRole } from '@prisma/client';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  // ============ User Management ============

  async getUsers(page = 1, limit = 20, search?: string, role?: string) {
    const where: Prisma.UserWhereInput = {};

    if (search) {
      where.OR = [
        { email: { contains: search } },
        { profile: { name: { contains: search } } },
      ];
    }

    if (role) {
      where.role = { equals: role as any };
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        include: { profile: true },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data: users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getUserById(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async updateUserRole(userId: string, role: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: { role: role as any },
      include: { profile: true },
    });
  }

  async disableUser(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: { isActive: false },
      include: { profile: true },
    });
  }

  async enableUser(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: { isActive: true },
      include: { profile: true },
    });
  }

  // ============ Order Management ============

  async getOrders(page = 1, limit = 20, status?: string, search?: string) {
    const where: Prisma.OrderWhereInput = {};

    if (status) {
      where.status = { equals: status as any };
    }

    if (search) {
      where.OR = [
        { id: { contains: search } },
        { patient: { profile: { name: { contains: search } } } },
      ];
    }

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        include: {
          patient: { include: { profile: true } },
          escort: { include: { profile: true } },
          hospital: true,
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      data: orders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getOrderById(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        patient: { include: { profile: true } },
        escort: { include: { profile: true } },
        hospital: true,
        payment: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }

  async updateOrderStatus(orderId: string, status: string) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return this.prisma.order.update({
      where: { id: orderId },
      data: { status: status as any },
      include: {
        patient: { include: { profile: true } },
        escort: { include: { profile: true } },
        hospital: true,
      },
    });
  }

  async assignEscort(orderId: string, escortId: string) {
    const [order, escort] = await Promise.all([
      this.prisma.order.findUnique({ where: { id: orderId } }),
      this.prisma.user.findUnique({ where: { id: escortId } }),
    ]);

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (!escort || escort.role !== 'ESCORT') {
      throw new NotFoundException('Escort not found or invalid role');
    }

    return this.prisma.order.update({
      where: { id: orderId },
      data: {
        escortId,
        status: 'MATCHED',
      },
      include: {
        patient: { include: { profile: true } },
        escort: { include: { profile: true } },
        hospital: true,
      },
    });
  }

  // ============ Escort Management ============

  async getEscorts(page = 1, limit = 20, status?: string, search?: string) {
    // Build where clause for escort profile filtering
    const whereClause: Prisma.UserWhereInput = {
      role: 'ESCORT',
    };

    let escortProfileWhere: Prisma.EscortProfileWhereInput | undefined;
    if (status === 'verified') {
      escortProfileWhere = { isVerified: true };
    } else if (status === 'pending') {
      escortProfileWhere = { isVerified: false };
    }

    if (search) {
      whereClause.OR = [
        { email: { contains: search } },
        { profile: { name: { contains: search } } },
      ];
    }

    const [escorts, total] = await Promise.all([
      this.prisma.user.findMany({
        where: whereClause,
        include: {
          profile: true,
          escortProfile: escortProfileWhere ? { where: escortProfileWhere } : true,
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where: whereClause }),
    ]);

    return {
      data: escorts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async verifyEscort(escortId: string, approved: boolean, reason?: string) {
    const escort = await this.prisma.user.findUnique({
      where: { id: escortId },
      include: { profile: true, escortProfile: true },
    });

    if (!escort || escort.role !== 'ESCORT') {
      throw new NotFoundException('Escort not found');
    }

    // Update both escortProfile and profile
    const [updated] = await Promise.all([
      this.prisma.user.update({
        where: { id: escortId },
        data: {
          profile: {
            update: {
              verificationNote: reason || (approved ? 'Approved' : 'Rejected'),
            },
          },
          escortProfile: {
            update: {
              isVerified: approved,
            },
          },
        },
        include: { profile: true, escortProfile: true },
      }),
    ]);

    return updated;
  }

  // ============ Statistics ============

  async getDashboardStats() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    // Get counts
    const [
      totalUsers,
      totalEscorts,
      verifiedEscorts,
      totalOrders,
      totalRevenue,
      thisMonthOrders,
      lastMonthOrders,
      thisMonthRevenue,
      lastMonthRevenue,
    ] = await Promise.all([
      this.prisma.user.count({ where: { role: { equals: 'USER' as UserRole } } }),
      this.prisma.user.count({ where: { role: { equals: 'ESCORT' as UserRole } } }),
      this.prisma.escortProfile.count({ where: { isVerified: true } }),
      this.prisma.order.count(),
      this.prisma.payment.aggregate({
        where: { status: 'COMPLETED' },
        _sum: { amount: true },
      }),
      this.prisma.order.count({ where: { createdAt: { gte: startOfMonth } } }),
      this.prisma.order.count({
        where: {
          createdAt: { gte: startOfLastMonth, lte: endOfLastMonth },
        },
      }),
      this.prisma.payment.aggregate({
        where: { status: 'COMPLETED', createdAt: { gte: startOfMonth } },
        _sum: { amount: true },
      }),
      this.prisma.payment.aggregate({
        where: {
          status: 'COMPLETED',
          createdAt: { gte: startOfLastMonth, lte: endOfLastMonth },
        },
        _sum: { amount: true },
      }),
    ]);

    // Get recent orders
    const recentOrders = await this.prisma.order.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        patient: { include: { profile: true } },
        escort: { include: { profile: true } },
        hospital: true,
      },
    });

    // Get orders by status
    const ordersByStatus = await this.prisma.order.groupBy({
      by: ['status'],
      _count: true,
    });

    // Get daily orders for last 7 days
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dayStart = new Date(date.setHours(0, 0, 0, 0));
      const dayEnd = new Date(date.setHours(23, 59, 59, 999));

      const count = await this.prisma.order.count({
        where: {
          createdAt: { gte: dayStart, lte: dayEnd },
        },
      });

      last7Days.push({
        date: dayStart.toISOString().split('T')[0],
        count,
      });
    }

    // Calculate growth rates
    const orderGrowth = lastMonthOrders > 0
      ? ((thisMonthOrders - lastMonthOrders) / lastMonthOrders * 100).toFixed(1)
      : 100;

    const revenueGrowth = lastMonthRevenue._sum.amount
      ? ((Number(thisMonthRevenue._sum.amount) - Number(lastMonthRevenue._sum.amount)) / Number(lastMonthRevenue._sum.amount) * 100).toFixed(1)
      : 100;

    return {
      overview: {
        totalUsers,
        totalEscorts,
        verifiedEscorts,
        totalOrders,
        totalRevenue: totalRevenue._sum.amount || 0,
      },
      trends: {
        thisMonthOrders,
        thisMonthRevenue: thisMonthRevenue._sum.amount || 0,
        orderGrowth: Number(orderGrowth),
        revenueGrowth: Number(revenueGrowth),
      },
      recentOrders,
      ordersByStatus: ordersByStatus.map((item) => ({
        status: item.status,
        count: item._count,
      })),
      dailyOrders: last7Days,
    };
  }

  async getRevenueStats(startDate: string, endDate: string) {
    const start = new Date(startDate);
    const end = new Date(endDate);

    const payments = await this.prisma.payment.findMany({
      where: {
        status: 'COMPLETED',
        createdAt: { gte: start, lte: end },
      },
      include: {
        order: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const totalRevenue = payments.reduce((sum, p) => sum + Number(p.amount), 0);
    const orderCount = new Set(payments.map(p => p.orderId)).size;
    const averageOrderValue = orderCount > 0 ? totalRevenue / orderCount : 0;

    // Group by date
    const revenueByDate = new Map();
    for (const payment of payments) {
      const date = payment.createdAt.toISOString().split('T')[0];
      const existing = revenueByDate.get(date) || { date, revenue: 0, count: 0 };
      existing.revenue += Number(payment.amount);
      existing.count += 1;
      revenueByDate.set(date, existing);
    }

    return {
      payments,
      totalRevenue,
      orderCount,
      averageOrderValue,
      revenueByDate: Array.from(revenueByDate.values()),
    };
  }
}
