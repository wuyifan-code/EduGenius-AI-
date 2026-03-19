import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class EscortsService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: { latitude?: number; longitude?: number; rating?: number }) {
    const escorts = await this.prisma.escortProfile.findMany({
      where: {
        isVerified: true,
        rating: query.rating ? { gte: query.rating } : undefined,
      },
      include: {
        user: {
          include: { profile: true },
        },
      },
      orderBy: { rating: 'desc' },
      take: 50,
    });

    return escorts.map((escort) => ({
      id: escort.id,
      name: escort.user.profile?.name || 'Unknown',
      rating: escort.rating,
      completedOrders: escort.completedOrders,
      isCertified: escort.isVerified,
      specialties: escort.specialties,
      imageUrl: escort.user.profile?.avatarUrl,
      distance: '附近', // Simplified - would calculate from lat/lng
    }));
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
    };
  }

  async findNearby(latitude: number, longitude: number, radiusKm: number = 10) {
    // Simplified - in production would use PostGIS for geospatial queries
    return this.findAll({});
  }
}
