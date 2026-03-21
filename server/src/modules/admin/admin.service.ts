import { Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma, UserRole, OrderStatus, RefundStatus } from '@prisma/client';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

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

  async updateUser(userId: string, data: { name?: string; phone?: string; role?: string; isActive?: boolean }) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const updateData: any = {};
    if (data.role) updateData.role = data.role;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    const profileUpdate: any = {};
    if (data.name) profileUpdate.name = data.name;
    if (data.phone) profileUpdate.phone = data.phone;

    return this.prisma.user.update({
      where: { id: userId },
      data: {
        ...updateData,
        profile: Object.keys(profileUpdate).length > 0 ? { update: profileUpdate } : undefined,
      },
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
        status: OrderStatus.MATCHED,
      },
      include: {
        patient: { include: { profile: true } },
        escort: { include: { profile: true } },
        hospital: true,
      },
    });
  }

  async cancelOrder(orderId: string, adminId: string, reason?: string) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.status === 'CANCELLED' || order.status === 'REFUNDED') {
      throw new ForbiddenException('Order is already cancelled or refunded');
    }

    // Update order status
    const updatedOrder = await this.prisma.order.update({
      where: { id: orderId },
      data: {
        status: OrderStatus.CANCELLED,
        paymentStatus: order.paymentStatus === 'COMPLETED' ? 'REFUNDED' : undefined,
      },
      include: {
        patient: { include: { profile: true } },
        escort: { include: { profile: true } },
        hospital: true,
      },
    });

    // Create order status history
    await this.prisma.orderStatusHistory.create({
      data: {
        orderId,
        status: 'CANCELLED',
        note: `Order cancelled by admin. Reason: ${reason || 'No reason provided'}`,
        createdBy: adminId,
      },
    });

    return updatedOrder;
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

  // ============ Statistics ============

  async getUserStats(startDate?: string, endDate?: string) {
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    const [
      totalUsers,
      newUsers,
      activeUsers,
      usersByRole,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { createdAt: { gte: start, lte: end } } }),
      this.prisma.user.count({
        where: {
          ordersAsPatient: { some: { createdAt: { gte: start, lte: end } } },
        },
      }),
      this.prisma.user.groupBy({
        by: ['role'],
        _count: true,
      }),
    ]);

    // Daily new users
    const dailyNewUsers = await this.prisma.$queryRaw`
      SELECT DATE(created_at) as date, COUNT(*) as count
      FROM users
      WHERE created_at >= ${start} AND created_at <= ${end}
      GROUP BY DATE(created_at)
      ORDER BY date
    `;

    return {
      totalUsers,
      newUsers,
      activeUsers,
      usersByRole: usersByRole.map(r => ({ role: r.role, count: r._count })),
      dailyNewUsers,
    };
  }

  async getOrderStats(startDate?: string, endDate?: string) {
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    const [
      totalOrders,
      ordersByStatus,
      completedOrders,
      cancelledOrders,
      refundedOrders,
      totalRevenue,
      refunds,
    ] = await Promise.all([
      this.prisma.order.count({ where: { createdAt: { gte: start, lte: end } } }),
      this.prisma.order.groupBy({
        by: ['status'],
        where: { createdAt: { gte: start, lte: end } },
        _count: true,
      }),
      this.prisma.order.count({
        where: { status: 'COMPLETED', createdAt: { gte: start, lte: end } },
      }),
      this.prisma.order.count({
        where: { status: 'CANCELLED', createdAt: { gte: start, lte: end } },
      }),
      this.prisma.order.count({
        where: { status: 'REFUNDED', createdAt: { gte: start, lte: end } },
      }),
      this.prisma.payment.aggregate({
        where: {
          status: 'COMPLETED',
          createdAt: { gte: start, lte: end },
        },
        _sum: { amount: true },
      }),
      this.prisma.refund.aggregate({
        where: {
          status: { in: ['APPROVED', 'COMPLETED'] },
          createdAt: { gte: start, lte: end },
        },
        _sum: { amount: true },
        _count: true,
      }),
    ]);

    const refundRate = totalOrders > 0 ? (refundedOrders / totalOrders * 100).toFixed(2) : '0.00';

    // Daily orders
    const dailyOrders = await this.prisma.$queryRaw`
      SELECT DATE(created_at) as date, COUNT(*) as count, SUM(price) as revenue
      FROM orders
      WHERE created_at >= ${start} AND created_at <= ${end}
      GROUP BY DATE(created_at)
      ORDER BY date
    `;

    return {
      totalOrders,
      ordersByStatus: ordersByStatus.map(s => ({ status: s.status, count: s._count })),
      completedOrders,
      cancelledOrders,
      refundedOrders,
      totalRevenue: totalRevenue._sum.amount || 0,
      totalRefunds: refunds._sum.amount || 0,
      refundRate: Number(refundRate),
      dailyOrders,
    };
  }

  // ============ Export ============

  async exportData(type: 'users' | 'orders' | 'escorts', format: 'csv' | 'excel', startDate?: string, endDate?: string) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;

    let data: any[] = [];
    let headers: string[] = [];

    switch (type) {
      case 'users':
        data = await this.prisma.user.findMany({
          where: start && end ? { createdAt: { gte: start, lte: end } } : undefined,
          include: { profile: true },
          orderBy: { createdAt: 'desc' },
        });
        headers = ['ID', 'Email', 'Name', 'Phone', 'Role', 'Status', 'Created At'];
        break;

      case 'orders':
        data = await this.prisma.order.findMany({
          where: start && end ? { createdAt: { gte: start, lte: end } } : undefined,
          include: {
            patient: { include: { profile: true } },
            escort: { include: { profile: true } },
            hospital: true,
          },
          orderBy: { createdAt: 'desc' },
        });
        headers = ['Order ID', 'Patient', 'Escort', 'Hospital', 'Service', 'Price', 'Status', 'Created At'];
        break;

      case 'escorts':
        data = await this.prisma.user.findMany({
          where: {
            role: 'ESCORT',
            ...(start && end ? { createdAt: { gte: start, lte: end } } : {}),
          },
          include: { profile: true, escortProfile: true },
          orderBy: { createdAt: 'desc' },
        });
        headers = ['ID', 'Email', 'Name', 'Phone', 'Verified', 'Rating', 'Completed Orders', 'Created At'];
        break;
    }

    // Convert to CSV format
    const csvRows = [headers.join(',')];

    for (const item of data) {
      let row: string[] = [];
      switch (type) {
        case 'users':
          row = [
            item.id,
            item.email,
            item.profile?.name || '',
            item.profile?.phone || '',
            item.role,
            item.isActive ? 'Active' : 'Inactive',
            item.createdAt.toISOString(),
          ];
          break;
        case 'orders':
          row = [
            item.id,
            item.patient?.profile?.name || '',
            item.escort?.profile?.name || '',
            item.hospital?.name || '',
            item.serviceType,
            item.price.toString(),
            item.status,
            item.createdAt.toISOString(),
          ];
          break;
        case 'escorts':
          row = [
            item.id,
            item.email,
            item.profile?.name || '',
            item.profile?.phone || '',
            item.escortProfile?.isVerified ? 'Yes' : 'No',
            item.escortProfile?.rating?.toString() || '0',
            item.escortProfile?.completedOrders?.toString() || '0',
            item.createdAt.toISOString(),
          ];
          break;
      }
      // Escape values containing commas or quotes
      const escapedRow = row.map(val => {
        const str = String(val || '');
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      });
      csvRows.push(escapedRow.join(','));
    }

    const csvContent = csvRows.join('\n');
    const filename = `${type}_export_${new Date().toISOString().split('T')[0]}.csv`;

    return {
      filename,
      content: csvContent,
      count: data.length,
    };
  }

  // ============ Refund Management ============

  async getRefunds(page = 1, limit = 20, status?: string) {
    const where = status ? { status: status as RefundStatus } : {};

    const [refunds, total] = await Promise.all([
      this.prisma.refund.findMany({
        where,
        include: {
          payment: {
            select: {
              method: true,
              wechatOrderId: true,
              stripePaymentIntentId: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.refund.count({ where }),
    ]);

    // Get user info for each refund
    const refundsWithUser = await Promise.all(
      refunds.map(async (refund) => {
        const user = await this.prisma.user.findUnique({
          where: { id: refund.userId },
          include: { profile: true },
        });
        return {
          ...refund,
          user: user ? {
            id: user.id,
            email: user.email,
            profile: user.profile,
          } : null,
        };
      })
    );

    return {
      data: refundsWithUser,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getRefundById(refundId: string) {
    const refund = await this.prisma.refund.findUnique({
      where: { id: refundId },
      include: {
        payment: {
          select: {
            method: true,
            amount: true,
            wechatOrderId: true,
            stripePaymentIntentId: true,
          },
        },
      },
    });

    if (!refund) {
      throw new NotFoundException('Refund not found');
    }

    // Get user info
    const user = await this.prisma.user.findUnique({
      where: { id: refund.userId },
      include: { profile: true },
    });

    // Get order info
    const order = await this.prisma.order.findUnique({
      where: { id: refund.orderId },
      include: {
        patient: { include: { profile: true } },
        hospital: true,
      },
    });

    // Get reviewer info if reviewed
    let reviewer = null;
    if (refund.reviewedBy) {
      reviewer = await this.prisma.user.findUnique({
        where: { id: refund.reviewedBy },
        include: { profile: true },
      });
    }

    return {
      ...refund,
      user: user ? {
        id: user.id,
        email: user.email,
        profile: user.profile,
      } : null,
      order: order ? {
        id: order.id,
        orderNo: order.orderNo,
        patient: order.patient,
        hospital: order.hospital,
        price: order.price,
      } : null,
      reviewer: reviewer ? {
        id: reviewer.id,
        name: reviewer.profile?.name || reviewer.email,
      } : null,
    };
  }

  async approveRefund(refundId: string, adminId: string, note?: string) {
    const refund = await this.prisma.refund.findUnique({
      where: { id: refundId },
      include: { payment: true },
    });

    if (!refund) {
      throw new NotFoundException('Refund not found');
    }

    if (refund.status !== 'PENDING') {
      throw new ForbiddenException('Refund is not pending');
    }

    // Update refund status
    const updatedRefund = await this.prisma.refund.update({
      where: { id: refundId },
      data: {
        status: 'APPROVED',
        reviewedBy: adminId,
        reviewedAt: new Date(),
        reviewNote: note,
      },
    });

    // Update payment status
    await this.prisma.payment.update({
      where: { id: refund.paymentId },
      data: {
        status: 'REFUNDED',
        refundedAt: new Date(),
      },
    });

    // Update order status
    await this.prisma.order.update({
      where: { id: refund.orderId },
      data: {
        status: 'REFUNDED',
        paymentStatus: 'REFUNDED',
      },
    });

    // Create order status history
    await this.prisma.orderStatusHistory.create({
      data: {
        orderId: refund.orderId,
        status: 'REFUNDED',
        note: `Refund approved. Amount: ¥${(refund.amount / 100).toFixed(2)}. ${note || ''}`,
        createdBy: adminId,
      },
    });

    this.logger.log(`Refund ${refundId} approved by admin ${adminId}`);

    return updatedRefund;
  }

  async rejectRefund(refundId: string, adminId: string, note?: string) {
    const refund = await this.prisma.refund.findUnique({
      where: { id: refundId },
    });

    if (!refund) {
      throw new NotFoundException('Refund not found');
    }

    if (refund.status !== 'PENDING') {
      throw new ForbiddenException('Refund is not pending');
    }

    // Update refund status
    const updatedRefund = await this.prisma.refund.update({
      where: { id: refundId },
      data: {
        status: 'REJECTED',
        reviewedBy: adminId,
        reviewedAt: new Date(),
        reviewNote: note,
      },
    });

    // Update order status back to previous state (CONFIRMED)
    await this.prisma.order.update({
      where: { id: refund.orderId },
      data: {
        status: 'CONFIRMED',
      },
    });

    // Create order status history
    await this.prisma.orderStatusHistory.create({
      data: {
        orderId: refund.orderId,
        status: 'CONFIRMED',
        note: `Refund rejected. Reason: ${note || 'No reason provided'}`,
        createdBy: adminId,
      },
    });

    this.logger.log(`Refund ${refundId} rejected by admin ${adminId}`);

    return updatedRefund;
  }
}
