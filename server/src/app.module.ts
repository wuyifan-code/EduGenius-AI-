import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { OrdersModule } from './modules/orders/orders.module';
import { MessagesModule } from './modules/messages/messages.module';
import { HospitalsModule } from './modules/hospitals/hospitals.module';
import { EscortsModule } from './modules/escorts/escorts.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { AdminModule } from './modules/admin/admin.module';
import { ReviewsModule } from './modules/reviews/reviews.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { UploadsModule } from './modules/uploads/uploads.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    // Rate limiting - 100 requests per minute
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),
    PrismaModule,
    AuthModule,
    UsersModule,
    OrdersModule,
    MessagesModule,
    HospitalsModule,
    EscortsModule,
    PaymentsModule,
    AdminModule,
    ReviewsModule,
    NotificationsModule,
    UploadsModule,
  ],
})
export class AppModule {}
