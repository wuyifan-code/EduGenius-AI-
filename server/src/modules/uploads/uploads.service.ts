import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as fs from 'fs';
import * as path from 'path';

export interface UploadedFile {
  filename: string;
  originalName: string;
  mimetype: string;
  size: number;
  url: string;
}

@Injectable()
export class UploadsService {
  private readonly uploadDir = './uploads';
  private readonly baseUrl = '/uploads';

  constructor(private prisma: PrismaService) {
    // Ensure upload directory exists
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async handleAvatarUpload(userId: string, file: Express.Multer.File): Promise<UploadedFile> {
    // Generate URL
    const url = `${this.baseUrl}/${file.filename}`;

    // Update user profile
    await this.prisma.userProfile.update({
      where: { userId },
      data: { avatarUrl: url },
    });

    return {
      filename: file.filename,
      originalName: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      url,
    };
  }

  async handleCertificateUpload(userId: string, file: Express.Multer.File): Promise<UploadedFile> {
    // Generate URL
    const url = `${this.baseUrl}/${file.filename}`;

    // Update escort profile with certificate info
    await this.prisma.escortProfile.update({
      where: { userId },
      data: {
        certificateNo: file.filename, // Store filename as reference
      },
    });

    return {
      filename: file.filename,
      originalName: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      url,
    };
  }

  async deleteFile(filename: string): Promise<boolean> {
    const filePath = path.join(this.uploadDir, filename);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }

    return false;
  }

  getFileUrl(filename: string): string {
    return `${this.baseUrl}/${filename}`;
  }
}
