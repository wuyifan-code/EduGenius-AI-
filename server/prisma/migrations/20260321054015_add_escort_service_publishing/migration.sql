-- CreateTable
CREATE TABLE "escort_services" (
    "id" TEXT NOT NULL,
    "escort_id" TEXT NOT NULL,
    "service_type" "ServiceType" NOT NULL,
    "title" TEXT,
    "description" TEXT,
    "price_per_hour" DOUBLE PRECISION NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "available_weekdays" INTEGER[],
    "time_slots" JSONB NOT NULL,
    "hospital_ids" TEXT[],
    "areas" TEXT[],
    "tags" TEXT[],
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "max_daily_orders" INTEGER NOT NULL DEFAULT 3,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "escort_services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_bookings" (
    "id" TEXT NOT NULL,
    "service_id" TEXT NOT NULL,
    "order_id" TEXT,
    "booking_date" DATE NOT NULL,
    "start_time" TEXT NOT NULL,
    "end_time" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'available',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "service_bookings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "escort_services_escort_id_idx" ON "escort_services"("escort_id");

-- CreateIndex
CREATE INDEX "escort_services_service_type_idx" ON "escort_services"("service_type");

-- CreateIndex
CREATE INDEX "escort_services_is_active_idx" ON "escort_services"("is_active");

-- CreateIndex
CREATE INDEX "escort_services_start_date_end_date_idx" ON "escort_services"("start_date", "end_date");

-- CreateIndex
CREATE UNIQUE INDEX "service_bookings_order_id_key" ON "service_bookings"("order_id");

-- CreateIndex
CREATE INDEX "service_bookings_service_id_idx" ON "service_bookings"("service_id");

-- CreateIndex
CREATE INDEX "service_bookings_order_id_idx" ON "service_bookings"("order_id");

-- CreateIndex
CREATE INDEX "service_bookings_booking_date_idx" ON "service_bookings"("booking_date");

-- CreateIndex
CREATE INDEX "service_bookings_status_idx" ON "service_bookings"("status");

-- CreateIndex
CREATE UNIQUE INDEX "service_bookings_service_id_booking_date_start_time_end_tim_key" ON "service_bookings"("service_id", "booking_date", "start_time", "end_time");

-- AddForeignKey
ALTER TABLE "escort_services" ADD CONSTRAINT "escort_services_escort_id_fkey" FOREIGN KEY ("escort_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_bookings" ADD CONSTRAINT "service_bookings_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "escort_services"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_bookings" ADD CONSTRAINT "service_bookings_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;
