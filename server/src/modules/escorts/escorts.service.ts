import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateEscortServiceDto } from './dto/create-escort-service.dto';
import { UpdateEscortServiceDto } from './dto/update-escort-service.dto';
import { ServiceType } from '@prisma/client';

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

  // ==================== Escort Service Publishing ====================

  /**
   * Create a new escort service publishing
   */
  async createService(escortId: string, dto: CreateEscortServiceDto) {
    // Validate date range
    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);
    
    if (startDate > endDate) {
      throw new BadRequestException('Start date must be before end date');
    }

    // Validate time slots
    for (const slot of dto.timeSlots) {
      if (slot.start >= slot.end) {
        throw new BadRequestException('Time slot start must be before end');
      }
    }

    const service = await this.prisma.escortService.create({
      data: {
        escortId,
        serviceType: dto.serviceType,
        title: dto.title,
        description: dto.description,
        pricePerHour: dto.pricePerHour,
        startDate,
        endDate,
        availableWeekdays: dto.availableWeekdays,
        timeSlots: dto.timeSlots as any,
        hospitalIds: dto.hospitalIds || [],
        areas: dto.areas || [],
        tags: dto.tags || [],
        maxDailyOrders: dto.maxDailyOrders || 3,
        isActive: true,
      },
    });

    return service;
  }

  /**
   * Get all services published by an escort
   */
  async getEscortServices(escortId: string) {
    const services = await this.prisma.escortService.findMany({
      where: { escortId },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { bookings: true },
        },
      },
    });

    return services.map(service => ({
      ...service,
      bookingCount: service._count.bookings,
    }));
  }

  /**
   * Get all active services (for patients to browse)
   */
  async getAllActiveServices(query: {
    serviceType?: ServiceType;
    area?: string;
    minPrice?: number;
    maxPrice?: number;
    page?: number;
    limit?: number;
  }) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {
      isActive: true,
      startDate: { lte: new Date() },
      endDate: { gte: new Date() },
    };

    if (query.serviceType) {
      where.serviceType = query.serviceType;
    }

    if (query.area) {
      where.areas = { has: query.area };
    }

    if (query.minPrice !== undefined || query.maxPrice !== undefined) {
      where.pricePerHour = {};
      if (query.minPrice !== undefined) {
        where.pricePerHour.gte = query.minPrice;
      }
      if (query.maxPrice !== undefined) {
        where.pricePerHour.lte = query.maxPrice;
      }
    }

    const [services, total] = await Promise.all([
      this.prisma.escortService.findMany({
        where,
        include: {
          escort: {
            include: {
              escortProfile: true,
              profile: true,
            },
          },
          _count: {
            select: { bookings: { where: { status: 'booked' } } },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.escortService.count({ where }),
    ]);

    return {
      data: services.map(service => ({
        id: service.id,
        serviceType: service.serviceType,
        title: service.title,
        description: service.description,
        pricePerHour: service.pricePerHour,
        startDate: service.startDate,
        endDate: service.endDate,
        availableWeekdays: service.availableWeekdays,
        timeSlots: service.timeSlots,
        areas: service.areas,
        tags: service.tags,
        escort: {
          id: service.escort.id,
          name: service.escort.profile?.name || 'Unknown',
          rating: service.escort.escortProfile?.rating || 0,
          completedOrders: service.escort.escortProfile?.completedOrders || 0,
          isCertified: service.escort.escortProfile?.isVerified || false,
          specialties: service.escort.escortProfile?.specialties || [],
          imageUrl: service.escort.profile?.avatarUrl,
          bio: service.escort.escortProfile?.bio,
        },
        bookedCount: service._count.bookings,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get a single service by ID
   */
  async getServiceById(serviceId: string) {
    const service = await this.prisma.escortService.findUnique({
      where: { id: serviceId },
      include: {
        escort: {
          include: {
            escortProfile: true,
            profile: true,
          },
        },
        _count: {
          select: { bookings: { where: { status: 'booked' } } },
        },
      },
    });

    if (!service) {
      throw new NotFoundException('Service not found');
    }

    return {
      ...service,
      escort: {
        id: service.escort.id,
        name: service.escort.profile?.name || 'Unknown',
        rating: service.escort.escortProfile?.rating || 0,
        completedOrders: service.escort.escortProfile?.completedOrders || 0,
        isCertified: service.escort.escortProfile?.isVerified || false,
        specialties: service.escort.escortProfile?.specialties || [],
        imageUrl: service.escort.profile?.avatarUrl,
        bio: service.escort.escortProfile?.bio,
      },
      bookedCount: service._count.bookings,
    };
  }

  /**
   * Update a service
   */
  async updateService(escortId: string, serviceId: string, dto: UpdateEscortServiceDto) {
    const service = await this.prisma.escortService.findUnique({
      where: { id: serviceId },
    });

    if (!service) {
      throw new NotFoundException('Service not found');
    }

    if (service.escortId !== escortId) {
      throw new ForbiddenException('You can only update your own services');
    }

    // Validate date range if provided
    if (dto.startDate && dto.endDate) {
      const startDate = new Date(dto.startDate);
      const endDate = new Date(dto.endDate);
      if (startDate > endDate) {
        throw new BadRequestException('Start date must be before end date');
      }
    }

    const updated = await this.prisma.escortService.update({
      where: { id: serviceId },
      data: {
        ...(dto.serviceType && { serviceType: dto.serviceType }),
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.pricePerHour && { pricePerHour: dto.pricePerHour }),
        ...(dto.startDate && { startDate: new Date(dto.startDate) }),
        ...(dto.endDate && { endDate: new Date(dto.endDate) }),
        ...(dto.availableWeekdays && { availableWeekdays: dto.availableWeekdays }),
        ...(dto.timeSlots && { timeSlots: dto.timeSlots as any }),
        ...(dto.hospitalIds && { hospitalIds: dto.hospitalIds }),
        ...(dto.areas && { areas: dto.areas }),
        ...(dto.tags && { tags: dto.tags }),
        ...(dto.maxDailyOrders && { maxDailyOrders: dto.maxDailyOrders }),
      },
    });

    return updated;
  }

  /**
   * Toggle service active status
   */
  async toggleServiceStatus(escortId: string, serviceId: string) {
    const service = await this.prisma.escortService.findUnique({
      where: { id: serviceId },
    });

    if (!service) {
      throw new NotFoundException('Service not found');
    }

    if (service.escortId !== escortId) {
      throw new ForbiddenException('You can only toggle your own services');
    }

    const updated = await this.prisma.escortService.update({
      where: { id: serviceId },
      data: { isActive: !service.isActive },
    });

    return updated;
  }

  /**
   * Delete a service
   */
  async deleteService(escortId: string, serviceId: string) {
    const service = await this.prisma.escortService.findUnique({
      where: { id: serviceId },
      include: {
        _count: {
          select: { bookings: { where: { status: 'booked' } } },
        },
      },
    });

    if (!service) {
      throw new NotFoundException('Service not found');
    }

    if (service.escortId !== escortId) {
      throw new ForbiddenException('You can only delete your own services');
    }

    if (service._count.bookings > 0) {
      throw new BadRequestException('Cannot delete service with active bookings');
    }

    await this.prisma.escortService.delete({
      where: { id: serviceId },
    });

    return { success: true };
  }

  /**
   * Get available time slots for a service on a specific date
   */
  async getServiceAvailability(serviceId: string, date: string) {
    const service = await this.prisma.escortService.findUnique({
      where: { id: serviceId },
    });

    if (!service) {
      throw new NotFoundException('Service not found');
    }

    const queryDate = new Date(date);
    const weekday = queryDate.getDay() || 7; // Convert Sunday (0) to 7

    // Check if service is available on this weekday
    if (!service.availableWeekdays.includes(weekday)) {
      return {
        available: false,
        reason: 'Service not available on this day',
        slots: [],
      };
    }

    // Check if date is within service date range
    if (queryDate < service.startDate || queryDate > service.endDate) {
      return {
        available: false,
        reason: 'Date outside service period',
        slots: [],
      };
    }

    // Get existing bookings for this date
    const existingBookings = await this.prisma.serviceBooking.findMany({
      where: {
        serviceId,
        bookingDate: queryDate,
        status: 'booked',
      },
    });

    // Calculate available slots
    const timeSlots = service.timeSlots as Array<{ start: string; end: string }>;
    const availableSlots = timeSlots.map(slot => {
      const isBooked = existingBookings.some(
        booking => booking.startTime === slot.start && booking.endTime === slot.end
      );
      return {
        ...slot,
        available: !isBooked,
      };
    });

    return {
      available: true,
      slots: availableSlots,
    };
  }

  /**
   * Book a service slot
   */
  async bookServiceSlot(
    serviceId: string,
    patientId: string,
    bookingData: {
      date: string;
      startTime: string;
      endTime: string;
      orderId: string;
    }
  ) {
    const service = await this.prisma.escortService.findUnique({
      where: { id: serviceId },
    });

    if (!service) {
      throw new NotFoundException('Service not found');
    }

    if (!service.isActive) {
      throw new BadRequestException('Service is not active');
    }

    const bookingDate = new Date(bookingData.date);

    // Check if slot is already booked
    const existingBooking = await this.prisma.serviceBooking.findFirst({
      where: {
        serviceId,
        bookingDate,
        startTime: bookingData.startTime,
        endTime: bookingData.endTime,
        status: 'booked',
      },
    });

    if (existingBooking) {
      throw new BadRequestException('This time slot is already booked');
    }

    // Check daily booking limit
    const dailyBookings = await this.prisma.serviceBooking.count({
      where: {
        serviceId,
        bookingDate,
        status: 'booked',
      },
    });

    if (dailyBookings >= service.maxDailyOrders) {
      throw new BadRequestException('Daily booking limit reached for this service');
    }

    const booking = await this.prisma.serviceBooking.create({
      data: {
        serviceId,
        orderId: bookingData.orderId,
        bookingDate,
        startTime: bookingData.startTime,
        endTime: bookingData.endTime,
        status: 'booked',
      },
    });

    return booking;
  }
}
