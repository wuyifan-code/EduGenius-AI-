import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

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

    // If location provided, calculate distances
    if (query.latitude !== undefined && query.longitude !== undefined) {
      return escorts
        .map((escort) => {
          const distance = escort.latitude && escort.longitude
            ? this.calculateDistance(
                query.latitude!,
                query.longitude!,
                escort.latitude,
                escort.longitude
              )
            : null;

          return {
            id: escort.id,
            name: escort.user.profile?.name || 'Unknown',
            rating: escort.rating,
            completedOrders: escort.completedOrders,
            isCertified: escort.isVerified,
            specialties: escort.specialties,
            imageUrl: escort.user.profile?.avatarUrl,
            distance: distance !== null
              ? distance < 1
                ? `${Math.round(distance * 1000)}m`
                : `${distance.toFixed(1)}km`
              : null,
            distanceValue: distance, // For sorting
          };
        })
        .filter(e => e.distanceValue === null || e.distanceValue <= 50) // Include escorts within 50km or without location
        .sort((a, b) => (a.distanceValue ?? Infinity) - (b.distanceValue ?? Infinity));
    }

    return escorts.map((escort) => ({
      id: escort.id,
      name: escort.user.profile?.name || 'Unknown',
      rating: escort.rating,
      completedOrders: escort.completedOrders,
      isCertified: escort.isVerified,
      specialties: escort.specialties,
      imageUrl: escort.user.profile?.avatarUrl,
      distance: null,
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
      latitude: escort.latitude,
      longitude: escort.longitude,
    };
  }

  async findNearby(latitude: number, longitude: number, radiusKm: number = 10) {
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
    return escorts
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
          distance: distance !== null
            ? distance < 1
              ? `${Math.round(distance * 1000)}m`
              : `${distance.toFixed(1)}km`
            : null,
          distanceValue: distance,
        };
      })
      .filter(e => e.distanceValue === null || e.distanceValue <= radiusKm)
      .sort((a, b) => (a.distanceValue ?? Infinity) - (b.distanceValue ?? Infinity));
  }

  async updateLocation(userId: string, latitude: number, longitude: number) {
    return this.prisma.escortProfile.update({
      where: { userId },
      data: { latitude, longitude },
    });
  }
}
