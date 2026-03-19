import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateOrderDto, UpdateOrderDto } from './dto/orders.dto';
import { OrderStatus } from '@prisma/client';

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

  async create(patientId: string, dto: CreateOrderDto) {
    return this.prisma.order.create({
      data: {
        patientId,
        hospitalId: dto.hospitalId,
        serviceId: dto.serviceId,
        serviceType: dto.serviceType,
        price: dto.price,
        appointmentDate: dto.appointmentDate,
        notes: dto.notes,
        status: OrderStatus.PENDING,
        paymentStatus: 'PENDING' as any,
      },
      include: {
        hospital: true,
        service: true,
        patient: {
          include: { profile: true },
        },
      },
    });
  }

  async findByPatient(patientId: string) {
    return this.prisma.order.findMany({
      where: { patientId },
      include: {
        hospital: true,
        service: true,
        escort: {
          include: { profile: true, escortProfile: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByEscort(escortId: string) {
    return this.prisma.order.findMany({
      where: {
        OR: [
          { escortId },
          { status: OrderStatus.PENDING }, // Available orders
        ],
      },
      include: {
        hospital: true,
        service: true,
        patient: {
          include: { profile: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

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
        reviews: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Check access
    if (role === 'PATIENT' && order.patientId !== userId) {
      throw new ForbiddenException('Access denied');
    }
    if (role === 'ESCORT' && order.escortId && order.escortId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    return order;
  }

  async acceptOrder(orderId: string, escortId: string) {
    return this.prisma.order.update({
      where: { id: orderId },
      data: {
        escortId,
        status: OrderStatus.MATCHED,
      },
      include: {
        hospital: true,
        service: true,
        patient: {
          include: { profile: true },
        },
      },
    });
  }

  async updateStatus(orderId: string, userId: string, status: OrderStatus) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Only patient can cancel, escort can complete
    if (order.patientId !== userId && order.escortId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    return this.prisma.order.update({
      where: { id: orderId },
      data: { status },
    });
  }
}
