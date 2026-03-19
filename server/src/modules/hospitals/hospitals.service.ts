import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class HospitalsService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: { keyword?: string; department?: string }) {
    const where: any = {};

    if (query.keyword) {
      where.OR = [
        { name: { contains: query.keyword, mode: 'insensitive' } },
        { department: { contains: query.keyword, mode: 'insensitive' } },
      ];
    }

    if (query.department) {
      where.department = { contains: query.department, mode: 'insensitive' };
    }

    return this.prisma.hospital.findMany({
      where,
      orderBy: { rating: 'desc' },
      take: 50,
    });
  }

  async findById(id: string) {
    return this.prisma.hospital.findUnique({
      where: { id },
    });
  }
}
