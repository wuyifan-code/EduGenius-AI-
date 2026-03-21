import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface EscortSearchQuery {
  keyword?: string;
  specialty?: string;
  minRating?: number;
  maxPrice?: number;
  minPrice?: number;
  latitude?: number;
  longitude?: number;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: string;
}

export interface PaginatedEscorts {
  data: any[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface EscortWithDistance {
  id: string;
  name: string;
  rating: number;
  completedOrders: number;
  isCertified: boolean;
  specialties: string[];
  imageUrl: string | null | undefined;
  distance: string | null;
  distanceValue?: number | null;
  hourlyRate?: number | null;
  bio?: string | null;
}

@Injectable()
export class EscortsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Calculate distance between two coordinates using Haversine formula
   * @returns Distance in kilometers
   */
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  async findAll(query: EscortSearchQuery): Promise<PaginatedEscorts> {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      isVerified: true,
    };

    // Keyword search
    if (query.keyword) {
      const keywordLower = query.keyword.toLowerCase();
      where.OR = [
        {
          user: {
            profile: {
              name: { contains: keywordLower, mode: 'insensitive' },
            },
          },
        },
        { bio: { contains: keywordLower, mode: 'insensitive' } },
        {
          specialties: {
            hasSome: [query.keyword],
          },
        },
      ];
    }

    // Specialty filter
    if (query.specialty) {
      where.specialties = {
        has: query.specialty,
      };
    }

    // Rating filter
    if (query.minRating !== undefined && query.minRating > 0) {
      where.rating = { gte: query.minRating };
    }

    // Price filters
    if (query.minPrice !== undefined || query.maxPrice !== undefined) {
      where.hourlyRate = {};
      if (query.minPrice !== undefined) {
        where.hourlyRate.gte = query.minPrice;
      }
      if (query.maxPrice !== undefined) {
        where.hourlyRate.lte = query.maxPrice;
      }
    }

    // Get total count
    const total = await this.prisma.escortProfile.count({
      where,
    });

    // Get escorts
    const escorts = await this.prisma.escortProfile.findMany({
      where,
      include: {
        user: {
          include: { profile: true },
        },
      },
      skip,
      take: limit,
    });

    // Process results with distance calculation if location provided
    let processedEscorts: EscortWithDistance[] = escorts.map((escort) => ({
      id: escort.id,
      name: escort.user.profile?.name || 'Unknown',
      rating: escort.rating,
      completedOrders: escort.completedOrders,
      isCertified: escort.isVerified,
      specialties: escort.specialties,
      imageUrl: escort.user.profile?.avatarUrl,
      hourlyRate: escort.hourlyRate,
      bio: escort.bio,
      distance: null,
      distanceValue: null,
    }));

    // Calculate distances if location provided
    if (query.latitude !== undefined && query.longitude !== undefined) {
      processedEscorts = processedEscorts
        .map((escort) => {
          const originalEscort = escorts.find(e => e.id === escort.id);
          const distance = originalEscort?.latitude && originalEscort?.longitude
            ? this.calculateDistance(
                query.latitude!,
                query.longitude!,
                originalEscort.latitude,
                originalEscort.longitude
              )
            : null;

          return {
            ...escort,
            distance: distance !== null
              ? distance < 1
                ? `${Math.round(distance * 1000)}m`
                : `${distance.toFixed(1)}km`
              : null,
            distanceValue: distance,
          };
        });
    }

    // Sort results
    const sortBy = query.sortBy || 'rating';
    const sortOrder = query.sortOrder || 'desc';

    processedEscorts.sort((a, b) => {
      let comparison: number;

      switch (sortBy) {
        case 'rating':
          comparison = a.rating - b.rating;
          break;
        case 'price':
          comparison = (a.hourlyRate || 0) - (b.hourlyRate || 0);
          break;
        case 'distance':
          comparison = (a.distanceValue ?? Infinity) - (b.distanceValue ?? Infinity);
          break;
        case 'orders':
          comparison = a.completedOrders - b.completedOrders;
          break;
        default:
          comparison = a.rating - b.rating;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return {
      data: processedEscorts,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(id: string) {
    const escort = await this.prisma.escortProfile.findUnique({
      where: { id },
      include: {
        user: {
          include: { profile: true },
        },
      },
    });

    if (!escort) {
      throw new NotFoundException('Escort not found');
    }

    return {
      id: escort.id,
      name: escort.user.profile?.name || 'Unknown',
      rating: escort.rating,
      completedOrders: escort.completedOrders,
      isCertified: escort.isVerified,
      specialties: escort.specialties,
      bio: escort.bio,
      hourlyRate: escort.hourlyRate,
      imageUrl: escort.user.profile?.avatarUrl,
      latitude: escort.latitude,
      longitude: escort.longitude,
    };
  }

  async findNearby(
    latitude: number,
    longitude: number,
    radiusKm: number = 10,
    limit: number = 20,
  ): Promise<EscortWithDistance[]> {
    // Get all verified escorts
    const escorts = await this.prisma.escortProfile.findMany({
      where: {
        isVerified: true,
      },
      include: {
        user: {
          include: { profile: true },
        },
      },
    });

    // Filter by distance and return sorted by distance
    const withDistance: EscortWithDistance[] = escorts
      .map((escort) => {
        const distance = escort.latitude && escort.longitude
          ? this.calculateDistance(latitude, longitude, escort.latitude, escort.longitude)
          : null;

        return {
          id: escort.id,
          name: escort.user.profile?.name || 'Unknown',
          rating: escort.rating,
          completedOrders: escort.completedOrders,
          isCertified: escort.isVerified,
          specialties: escort.specialties,
          imageUrl: escort.user.profile?.avatarUrl,
          hourlyRate: escort.hourlyRate,
          bio: escort.bio,
          distance: distance !== null
            ? distance < 1
              ? `${Math.round(distance * 1000)}m`
              : `${distance.toFixed(1)}km`
            : null,
          distanceValue: distance,
        };
      })
      .filter(e => e.distanceValue === null || e.distanceValue <= radiusKm)
      .sort((a, b) => (a.distanceValue ?? Infinity) - (b.distanceValue ?? Infinity))
      .slice(0, limit);

    return withDistance;
  }

  async getSuggestions(query: string, limit: number = 10) {
    if (!query || query.trim().length === 0) {
      return [];
    }

    const queryLower = query.toLowerCase();

    // Search for escorts by name, bio, or specialties
    const escorts = await this.prisma.escortProfile.findMany({
      where: {
        isVerified: true,
        OR: [
          {
            user: {
              profile: {
                name: { contains: queryLower, mode: 'insensitive' },
              },
            },
          },
          { bio: { contains: queryLower, mode: 'insensitive' } },
          {
            specialties: {
              hasSome: [query],
            },
          },
        ],
      },
      include: {
        user: {
          include: { profile: true },
        },
      },
      take: limit,
      orderBy: { rating: 'desc' },
    });

    return escorts.map(escort => ({
      id: escort.id,
      name: escort.user.profile?.name || 'Unknown',
      type: 'escort',
      subtitle: `${escort.specialties.slice(0, 3).join(' · ')}`,
      rating: escort.rating,
      hourlyRate: escort.hourlyRate,
    }));
  }

  async getPopular(limit: number = 10) {
    const escorts = await this.prisma.escortProfile.findMany({
      where: {
        isVerified: true,
      },
      include: {
        user: {
          include: { profile: true },
        },
      },
      orderBy: [
        { rating: 'desc' },
        { completedOrders: 'desc' },
      ],
      take: limit,
    });

    return escorts.map((escort, index) => ({
      id: escort.id,
      name: escort.user.profile?.name || 'Unknown',
      rating: escort.rating,
      completedOrders: escort.completedOrders,
      isCertified: escort.isVerified,
      specialties: escort.specialties,
      imageUrl: escort.user.profile?.avatarUrl,
      hourlyRate: escort.hourlyRate,
      bio: escort.bio,
      rank: index + 1,
    }));
  }

  async getSpecialties() {
    const escorts = await this.prisma.escortProfile.findMany({
      where: { isVerified: true },
      select: { specialties: true },
    });

    // Extract unique specialties
    const specialtySet = new Set<string>();
    escorts.forEach(escort => {
      escort.specialties.forEach(specialty => {
        specialtySet.add(specialty);
      });
    });

    return Array.from(specialtySet).sort();
  }

  async updateLocation(userId: string, latitude: number, longitude: number) {
    return this.prisma.escortProfile.update({
      where: { userId },
      data: { latitude, longitude },
    });
  }
}
