import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface HospitalSearchQuery {
  keyword?: string;
  department?: string;
  level?: string;
  minRating?: number;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: string;
}

export interface PaginatedHospitals {
  data: any[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable()
export class HospitalsService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: HospitalSearchQuery): Promise<PaginatedHospitals> {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};

    // Keyword search across multiple fields
    if (query.keyword) {
      const keywordLower = query.keyword.toLowerCase();
      where.OR = [
        { name: { contains: keywordLower, mode: 'insensitive' } },
        { address: { contains: keywordLower, mode: 'insensitive' } },
        { department: { contains: keywordLower, mode: 'insensitive' } },
        { phone: { contains: keywordLower, mode: 'insensitive' } },
      ];
    }

    // Department filter
    if (query.department) {
      where.department = { contains: query.department, mode: 'insensitive' };
    }

    // Level filter
    if (query.level) {
      where.level = { contains: query.level, mode: 'insensitive' };
    }

    // Minimum rating filter
    if (query.minRating !== undefined && query.minRating > 0) {
      where.rating = { gte: query.minRating };
    }

    // Build order by
    const orderBy: any = {};
    const sortBy = query.sortBy || 'rating';
    const sortOrder = query.sortOrder || 'desc';
    
    if (sortBy === 'name') {
      orderBy.name = sortOrder;
    } else if (sortBy === 'createdAt') {
      orderBy.createdAt = sortOrder;
    } else {
      // Default sort by rating
      orderBy.rating = sortOrder;
    }

    // Get total count for pagination
    const total = await this.prisma.hospital.count({ where });

    // Get paginated results
    const hospitals = await this.prisma.hospital.findMany({
      where,
      orderBy,
      skip,
      take: limit,
    });

    return {
      data: hospitals,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(id: string) {
    return this.prisma.hospital.findUnique({
      where: { id },
    });
  }

  async getSuggestions(query: string, limit: number = 10) {
    if (!query || query.trim().length === 0) {
      return [];
    }

    const queryLower = query.toLowerCase();

    // Search for hospital names
    const hospitals = await this.prisma.hospital.findMany({
      where: {
        OR: [
          { name: { contains: queryLower, mode: 'insensitive' } },
          { department: { contains: queryLower, mode: 'insensitive' } },
          { address: { contains: queryLower, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        name: true,
        department: true,
        level: true,
        address: true,
      },
      take: limit,
      orderBy: { rating: 'desc' },
    });

    return hospitals.map(hospital => ({
      id: hospital.id,
      name: hospital.name,
      type: 'hospital',
      subtitle: `${hospital.level} · ${hospital.department}`,
      address: hospital.address,
    }));
  }

  async getPopular(limit: number = 10) {
    const hospitals = await this.prisma.hospital.findMany({
      orderBy: [
        { rating: 'desc' },
        { createdAt: 'desc' },
      ],
      take: limit,
    });

    return hospitals.map((hospital, index) => ({
      ...hospital,
      rank: index + 1,
    }));
  }

  async getDepartments() {
    const hospitals = await this.prisma.hospital.findMany({
      select: { department: true },
      distinct: ['department'],
    });

    return hospitals.map(h => h.department).filter(Boolean).sort();
  }
}
