import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ChatGateway } from './chat.gateway';
import { MessagesService } from '../messages.service';
import { PrismaService } from '../../../prisma/prisma.service';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'default-secret',
    }),
  ],
  providers: [ChatGateway, MessagesService, PrismaService],
  exports: [ChatGateway],
})
export class GatewayModule {}
