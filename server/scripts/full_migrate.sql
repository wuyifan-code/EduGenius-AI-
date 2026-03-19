-- ============================================
-- STEP 1: DROP ALL EXISTING OBJECTS
-- ============================================

-- Drop foreign keys first
ALTER TABLE IF EXISTS "user_profiles" DROP CONSTRAINT IF EXISTS "user_profiles_user_id_fkey";
ALTER TABLE IF EXISTS "escort_profiles" DROP CONSTRAINT IF EXISTS "escort_profiles_user_id_fkey";
ALTER TABLE IF EXISTS "orders" DROP CONSTRAINT IF EXISTS "orders_patient_id_fkey";
ALTER TABLE IF EXISTS "orders" DROP CONSTRAINT IF EXISTS "orders_escort_id_fkey";
ALTER TABLE IF EXISTS "orders" DROP CONSTRAINT IF EXISTS "orders_hospital_id_fkey";
ALTER TABLE IF EXISTS "orders" DROP CONSTRAINT IF EXISTS "orders_service_id_fkey";
ALTER TABLE IF EXISTS "messages" DROP CONSTRAINT IF EXISTS "messages_order_id_fkey";
ALTER TABLE IF EXISTS "messages" DROP CONSTRAINT IF EXISTS "messages_sender_id_fkey";
ALTER TABLE IF EXISTS "messages" DROP CONSTRAINT IF EXISTS "messages_receiver_id_fkey";
ALTER TABLE IF EXISTS "reviews" DROP CONSTRAINT IF EXISTS "reviews_order_id_fkey";
ALTER TABLE IF EXISTS "reviews" DROP CONSTRAINT IF EXISTS "reviews_author_id_fkey";
ALTER TABLE IF EXISTS "reviews" DROP CONSTRAINT IF EXISTS "reviews_target_id_fkey";
ALTER TABLE IF EXISTS "payments" DROP CONSTRAINT IF EXISTS "payments_order_id_fkey";
ALTER TABLE IF EXISTS "notifications" DROP CONSTRAINT IF EXISTS "notifications_user_id_fkey";

-- Drop tables
DROP TABLE IF EXISTS "notifications" CASCADE;
DROP TABLE IF EXISTS "payments" CASCADE;
DROP TABLE IF EXISTS "refresh_tokens" CASCADE;
DROP TABLE IF EXISTS "reviews" CASCADE;
DROP TABLE IF EXISTS "messages" CASCADE;
DROP TABLE IF EXISTS "orders" CASCADE;
DROP TABLE IF EXISTS "services" CASCADE;
DROP TABLE IF EXISTS "hospitals" CASCADE;
DROP TABLE IF EXISTS "escort_profiles" CASCADE;
DROP TABLE IF EXISTS "user_profiles" CASCADE;
DROP TABLE IF EXISTS "users" CASCADE;

-- Drop enum types
DROP TYPE IF EXISTS "UserRole" CASCADE;
DROP TYPE IF EXISTS "OrderStatus" CASCADE;
DROP TYPE IF EXISTS "ServiceType" CASCADE;
DROP TYPE IF EXISTS "PaymentStatus" CASCADE;
DROP TYPE IF EXISTS "PaymentMethod" CASCADE;

-- ============================================
-- STEP 2: CREATE ALL TABLES
-- ============================================

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('GUEST', 'PATIENT', 'ESCORT', 'ADMIN');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'CONFIRMED', 'MATCHED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ServiceType" AS ENUM ('FULL_PROCESS', 'APPOINTMENT', 'REPORT_PICKUP', 'VIP_TRANSPORT');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'COMPLETED', 'REFUNDED', 'FAILED');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('STRIPE', 'WECHAT', 'ALIPAY');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'GUEST',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_profiles" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT,
    "phone" TEXT,
    "avatar_url" TEXT,
    "bio" TEXT,
    "gender" TEXT,
    "age" INTEGER,
    "verification_note" TEXT,

    CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "escort_profiles" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "rating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "completed_orders" INTEGER NOT NULL DEFAULT 0,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "specialties" TEXT[],
    "certificate_no" TEXT,
    "bio" TEXT,
    "hourly_rate" DOUBLE PRECISION,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,

    CONSTRAINT "escort_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hospitals" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "phone" TEXT,
    "rating" DOUBLE PRECISION,
    "image_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hospitals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "services" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "base_price" DOUBLE PRECISION NOT NULL,
    "type" "ServiceType" NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders" (
    "id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "escort_id" TEXT,
    "hospital_id" TEXT NOT NULL,
    "service_id" TEXT NOT NULL,
    "service_type" "ServiceType" NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
    "price" DOUBLE PRECISION NOT NULL,
    "payment_status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "appointment_date" TIMESTAMP(3),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" TEXT NOT NULL,
    "order_id" TEXT,
    "sender_id" TEXT NOT NULL,
    "receiver_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reviews" (
    "id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "author_id" TEXT NOT NULL,
    "target_id" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'cny',
    "method" "PaymentMethod" NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "stripe_payment_intent_id" TEXT,
    "wechat_order_id" TEXT,
    "paid_at" TIMESTAMP(3),
    "refunded_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "data" JSONB,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "user_profiles_user_id_key" ON "user_profiles"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "escort_profiles_user_id_key" ON "escort_profiles"("user_id");

-- CreateIndex
CREATE INDEX "orders_patient_id_idx" ON "orders"("patient_id");

-- CreateIndex
CREATE INDEX "orders_escort_id_idx" ON "orders"("escort_id");

-- CreateIndex
CREATE INDEX "orders_status_idx" ON "orders"("status");

-- CreateIndex
CREATE INDEX "orders_created_at_idx" ON "orders"("created_at");

-- CreateIndex
CREATE INDEX "orders_payment_status_idx" ON "orders"("payment_status");

-- CreateIndex
CREATE INDEX "messages_sender_id_idx" ON "messages"("sender_id");

-- CreateIndex
CREATE INDEX "messages_receiver_id_idx" ON "messages"("receiver_id");

-- CreateIndex
CREATE INDEX "messages_created_at_idx" ON "messages"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_user_id_key" ON "refresh_tokens"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_key" ON "refresh_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "payments_order_id_key" ON "payments"("order_id");

-- CreateIndex
CREATE UNIQUE INDEX "payments_stripe_payment_intent_id_key" ON "payments"("stripe_payment_intent_id");

-- CreateIndex
CREATE UNIQUE INDEX "payments_wechat_order_id_key" ON "payments"("wechat_order_id");

-- AddForeignKey
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "escort_profiles" ADD CONSTRAINT "escort_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_escort_id_fkey" FOREIGN KEY ("escort_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_hospital_id_fkey" FOREIGN KEY ("hospital_id") REFERENCES "hospitals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "services"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_receiver_id_fkey" FOREIGN KEY ("receiver_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_target_id_fkey" FOREIGN KEY ("target_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
