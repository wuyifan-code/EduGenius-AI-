import { Test, TestingModule } from '@nestjs/testing';
import { ReviewsService } from './reviews.service';
import { PrismaService } from '../../prisma/prisma.service';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

describe('ReviewsService', () => {
  let service: ReviewsService;
  let prismaService: Partial<PrismaService>;

  const mockOrder = {
    id: 'order-1',
    patientId: 'patient-1',
    escortId: 'escort-1',
    status: 'COMPLETED',
    price: 100,
  };

  const mockReview = {
    id: 'review-1',
    orderId: 'order-1',
    authorId: 'patient-1',
    targetId: 'escort-1',
    rating: 5,
    comment: 'Great service!',
    createdAt: new Date(),
    author: {
      profile: { name: 'Patient Name' },
    },
    target: {
      profile: { name: 'Escort Name' },
    },
    order: mockOrder,
  };

  beforeEach(async () => {
    prismaService = {
      order: {
        findUnique: jest.fn(),
      },
      review: {
        create: jest.fn().mockResolvedValue(mockReview),
        findMany: jest.fn().mockResolvedValue([mockReview]),
        findFirst: jest.fn(),
        aggregate: jest.fn().mockResolvedValue({ _avg: { rating: 4.5 }, _count: 10 }),
        count: jest.fn().mockResolvedValue(1),
      },
      escortProfile: {
        updateMany: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReviewsService,
        {
          provide: PrismaService,
          useValue: prismaService,
        },
      ],
    }).compile();

    service = module.get<ReviewsService>(ReviewsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a review for completed order', async () => {
      (prismaService.order!.findUnique as jest.Mock).mockResolvedValueOnce(mockOrder);

      const result = await service.create('order-1', 'patient-1', 'escort-1', 5, 'Great service!');

      expect(result).toEqual(mockReview);
      expect(prismaService.review!.create).toHaveBeenCalled();
    });

    it('should throw NotFoundException for non-existent order', async () => {
      (prismaService.order!.findUnique as jest.Mock).mockResolvedValueOnce(null);

      await expect(
        service.create('non-existent', 'patient-1', 'escort-1', 5)
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException for non-completed order', async () => {
      (prismaService.order!.findUnique as jest.Mock).mockResolvedValueOnce({
        ...mockOrder,
        status: 'PENDING',
      });

      await expect(
        service.create('order-1', 'patient-1', 'escort-1', 5)
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('getByOrder', () => {
    it('should return reviews for an order', async () => {
      const result = await service.getByOrder('order-1');

      expect(result).toHaveLength(1);
      expect(prismaService.review!.findMany).toHaveBeenCalledWith({
        where: { orderId: 'order-1' },
        include: expect.any(Object),
      });
    });
  });

  describe('getByTarget', () => {
    it('should return reviews for a target user with pagination', async () => {
      const result = await service.getByTarget('escort-1', 1, 10);

      expect(result.reviews).toHaveLength(1);
      expect(result.averageRating).toBe(4.5);
      expect(result.pagination.total).toBe(1);
    });
  });

  describe('checkCanReview', () => {
    it('should return canReview=true for eligible order', async () => {
      (prismaService.order!.findUnique as jest.Mock).mockResolvedValueOnce(mockOrder);
      (prismaService.review!.findFirst as jest.Mock).mockResolvedValueOnce(null);

      const result = await service.checkCanReview('order-1', 'patient-1');

      expect(result.canReview).toBe(true);
      expect(result.targetId).toBe('escort-1');
    });

    it('should return canReview=false for non-completed order', async () => {
      (prismaService.order!.findUnique as jest.Mock).mockResolvedValueOnce({
        ...mockOrder,
        status: 'PENDING',
      });

      const result = await service.checkCanReview('order-1', 'patient-1');

      expect(result.canReview).toBe(false);
    });

    it('should return canReview=false if already reviewed', async () => {
      (prismaService.order!.findUnique as jest.Mock).mockResolvedValueOnce(mockOrder);
      (prismaService.review!.findFirst as jest.Mock).mockResolvedValueOnce(mockReview);

      const result = await service.checkCanReview('order-1', 'patient-1');

      expect(result.canReview).toBe(false);
    });
  });
});
