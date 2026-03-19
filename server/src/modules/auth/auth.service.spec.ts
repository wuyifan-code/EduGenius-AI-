import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConflictException, UnauthorizedException } from '@nestjs/common';

describe('AuthService', () => {
  let service: AuthService;
  let prismaService: Partial<PrismaService>;
  let jwtService: Partial<JwtService>;

  beforeEach(async () => {
    prismaService = {
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },
      refreshToken: {
        findUnique: jest.fn(),
        create: jest.fn(),
        delete: jest.fn(),
        deleteMany: jest.fn(),
      },
    };

    jwtService = {
      signAsync: jest.fn().mockResolvedValue('mock-token'),
      verify: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prismaService },
        { provide: JwtService, useValue: jwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    it('should throw ConflictException if email exists', async () => {
      (prismaService.user!.findUnique as jest.Mock).mockResolvedValue({
        id: 'existing-user',
        email: 'test@example.com',
      });

      await expect(
        service.register({
          email: 'test@example.com',
          password: 'password123',
          role: 'PATIENT' as any,
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should create user successfully', async () => {
      (prismaService.user!.findUnique as jest.Mock).mockResolvedValue(null);
      (prismaService.user!.create as jest.Mock).mockResolvedValue({
        id: 'new-user',
        email: 'new@example.com',
        role: 'PATIENT',
        passwordHash: 'hashed-password',
      });
      (prismaService.refreshToken!.create as jest.Mock).mockResolvedValue({});

      const result = await service.register({
        email: 'new@example.com',
        password: 'password123',
        role: 'PATIENT' as any,
      });

      expect(result.accessToken).toBeDefined();
      expect(result.user).toBeDefined();
      expect(prismaService.user!.create).toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('should throw UnauthorizedException if user not found', async () => {
      (prismaService.user!.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        service.login({
          email: 'notfound@example.com',
          password: 'password123',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if password invalid', async () => {
      (prismaService.user!.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        passwordHash: 'hashed-password',
        isActive: true,
      });

      // bcrypt.compare will return false
      await expect(
        service.login({
          email: 'test@example.com',
          password: 'wrong-password',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
