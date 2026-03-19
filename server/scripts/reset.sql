-- Drop all tables and types in correct order

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

-- Now create all tables (run migrate.sql content)
