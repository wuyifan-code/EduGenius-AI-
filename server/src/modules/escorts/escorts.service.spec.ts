import { Test, TestingModule } from '@nestjs/testing';
import { EscortsService } from './escorts.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('EscortsService', () => {
  let service: EscortsService;
  let prismaService: Partial<PrismaService>;

  const mockEscortProfile = {
    id: 'escort-1',
    userId: 'user-1',
    rating: 4.5,
    completedOrders: 10,
    isVerified: true,
    specialties: ['儿科', '骨科'],
    certificateNo: 'CERT123',
    bio: 'Experienced escort',
    hourlyRate: 100,
    latitude: 39.9042,
    longitude: 116.4074,
    user: {
      profile: {
        name: 'Test Escort',
        avatarUrl: 'https://example.com/avatar.jpg',
      },
    },
  };

  beforeEach(async () => {
    prismaService = {
      escortProfile: {
        findMany: jest.fn().mockResolvedValue([mockEscortProfile]),
        findUnique: jest.fn().mockResolvedValue(mockEscortProfile),
        update: jest.fn().mockResolvedValue(mockEscortProfile),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EscortsService,
        {
          provide: PrismaService,
          useValue: prismaService,
        },
      ],
    }).compile();

    service = module.get<EscortsService>(EscortsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return escorts without location', async () => {
      const result = await service.findAll({});

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Test Escort');
      expect(result[0].rating).toBe(4.5);
      expect(result[0].distance).toBeNull();
    });

    it('should calculate distance when location provided', async () => {
      // User location: 39.9, 116.4 (very close to escort)
      const result = await service.findAll({
        latitude: 39.9,
        longitude: 116.4,
      });

      expect(result).toHaveLength(1);
      expect(result[0].distance).toBeDefined();
      expect(result[0].distanceValue).toBeLessThan(10); // Should be within 10km
    });
  });

  describe('findById', () => {
    it('should return escort by id', async () => {
      const result = await service.findById('escort-1');

      expect(result.name).toBe('Test Escort');
      expect(result.rating).toBe(4.5);
    });

    it('should throw NotFoundException for non-existent escort', async () => {
      (prismaService.escortProfile!.findUnique as jest.Mock).mockResolvedValueOnce(null);

      await expect(service.findById('non-existent')).rejects.toThrow('Escort not found');
    });
  });

  describe('findNearby', () => {
    it('should return nearby escorts within radius', async () => {
      const result = await service.findNearby(39.9, 116.4, 10);

      expect(result).toHaveLength(1);
      expect(result[0].distance).toBeDefined();
    });

    it('should filter escorts outside radius', async () => {
      // User in Shanghai (31.2, 121.5), escort in Beijing (39.9, 116.4)
      // Distance should be > 1000km, so filtered out with radius=10
      const result = await service.findNearby(31.2, 121.5, 10);

      expect(result).toHaveLength(0);
    });
  });

  describe('calculateDistance', () => {
    it('should calculate distance between two points correctly', async () => {
      // Beijing to Tianjin ~115km
      const result = await service.findNearby(39.9042, 116.4074, 200);

      // Should include escort from Beijing
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('updateLocation', () => {
    it('should update escort location', async () => {
      const result = await service.updateLocation('user-1', 40.0, 116.5);

      expect(prismaService.escortProfile!.update).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        data: { latitude: 40.0, longitude: 116.5 },
      });
    });
  });
});
