import { sql } from "drizzle-orm";
import {
  pgTable,
  text,
  varchar,
  timestamp,
  boolean,
  integer,
  float,
  jsonb,
  index,
  uuid,
  pgEnum,
} from "drizzle-orm/pg-core";

// ==================== ENUMS ====================

export const userRoleEnum = pgEnum("user_role", ["GUEST", "PATIENT", "ESCORT", "ADMIN"]);
export const orderStatusEnum = pgEnum("order_status", ["PENDING", "CONFIRMED", "MATCHED", "IN_PROGRESS", "COMPLETED", "CANCELLED"]);
export const serviceTypeEnum = pgEnum("service_type", ["FULL_PROCESS", "APPOINTMENT", "REPORT_PICKUP", "VIP_TRANSPORT"]);
export const paymentStatusEnum = pgEnum("payment_status", ["PENDING", "COMPLETED", "REFUNDED", "FAILED"]);
export const paymentMethodEnum = pgEnum("payment_method", ["STRIPE", "WECHAT", "ALIPAY"]);

// ==================== MODELS ====================

// 用户表
export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    passwordHash: varchar("password_hash", { length: 255 }).notNull(),
    role: userRoleEnum("role").default("GUEST").notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("users_email_idx").on(table.email),
    index("users_role_idx").on(table.role),
  ]
);

// 用户资料表
export const userProfiles = pgTable(
  "user_profiles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull().unique().references(() => users.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 128 }),
    phone: varchar("phone", { length: 32 }),
    avatarUrl: text("avatar_url"),
    bio: text("bio"),
    gender: varchar("gender", { length: 16 }),
    age: integer("age"),
    verificationNote: text("verification_note"),
  },
  (table) => [
    index("user_profiles_user_id_idx").on(table.userId),
  ]
);

// 陪诊师资料表
export const escortProfiles = pgTable(
  "escort_profiles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull().unique().references(() => users.id, { onDelete: "cascade" }),
    rating: float("rating").default(0).notNull(),
    completedOrders: integer("completed_orders").default(0).notNull(),
    isVerified: boolean("is_verified").default(false).notNull(),
    specialties: text("specialties").array().notNull().default(sql`'{}'::text[]`),
    certificateNo: varchar("certificate_no", { length: 64 }),
    bio: text("bio"),
    hourlyRate: float("hourly_rate"),
    latitude: float("latitude"),
    longitude: float("longitude"),
  },
  (table) => [
    index("escort_profiles_user_id_idx").on(table.userId),
    index("escort_profiles_rating_idx").on(table.rating),
  ]
);

// 医院表
export const hospitals = pgTable(
  "hospitals",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 255 }).notNull(),
    department: varchar("department", { length: 128 }).notNull(),
    level: varchar("level", { length: 32 }).notNull(),
    address: varchar("address", { length: 512 }).notNull(),
    phone: varchar("phone", { length: 32 }),
    rating: float("rating"),
    imageUrl: text("image_url"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("hospitals_name_idx").on(table.name),
  ]
);

// 服务类型表
export const services = pgTable(
  "services",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 128 }).notNull(),
    description: text("description"),
    basePrice: float("base_price").notNull(),
    type: serviceTypeEnum("type").notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("services_type_idx").on(table.type),
  ]
);

// 订单表
export const orders = pgTable(
  "orders",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    patientId: uuid("patient_id").notNull().references(() => users.id),
    escortId: uuid("escort_id").references(() => users.id),
    hospitalId: uuid("hospital_id").notNull().references(() => hospitals.id),
    serviceId: uuid("service_id").notNull().references(() => services.id),
    serviceType: serviceTypeEnum("service_type").notNull(),
    status: orderStatusEnum("status").default("PENDING").notNull(),
    price: float("price").notNull(),
    paymentStatus: paymentStatusEnum("payment_status").default("PENDING").notNull(),
    appointmentDate: timestamp("appointment_date", { withTimezone: true }),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("orders_patient_id_idx").on(table.patientId),
    index("orders_escort_id_idx").on(table.escortId),
    index("orders_status_idx").on(table.status),
  ]
);

// 消息表
export const messages = pgTable(
  "messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderId: uuid("order_id").references(() => orders.id),
    senderId: uuid("sender_id").notNull().references(() => users.id),
    receiverId: uuid("receiver_id").notNull().references(() => users.id),
    content: text("content").notNull(),
    isRead: boolean("is_read").default(false).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("messages_order_id_idx").on(table.orderId),
    index("messages_sender_id_idx").on(table.senderId),
    index("messages_receiver_id_idx").on(table.receiverId),
  ]
);

// 评价表
export const reviews = pgTable(
  "reviews",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderId: uuid("order_id").notNull().references(() => orders.id),
    authorId: uuid("author_id").notNull().references(() => users.id),
    targetId: uuid("target_id").notNull().references(() => users.id),
    rating: integer("rating").notNull(),
    comment: text("comment"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("reviews_order_id_idx").on(table.orderId),
    index("reviews_target_id_idx").on(table.targetId),
  ]
);

// 刷新令牌表
export const refreshTokens = pgTable(
  "refresh_tokens",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull().unique().references(() => users.id),
    token: varchar("token", { length: 512 }).notNull().unique(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("refresh_tokens_user_id_idx").on(table.userId),
    index("refresh_tokens_token_idx").on(table.token),
  ]
);

// 支付记录表
export const payments = pgTable(
  "payments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderId: uuid("order_id").notNull().unique().references(() => orders.id),
    userId: uuid("user_id").notNull(),
    amount: float("amount").notNull(),
    currency: varchar("currency", { length: 8 }).default("cny").notNull(),
    method: paymentMethodEnum("method").notNull(),
    status: paymentStatusEnum("status").default("PENDING").notNull(),
    stripePaymentIntentId: varchar("stripe_payment_intent_id", { length: 128 }).unique(),
    wechatOrderId: varchar("wechat_order_id", { length: 128 }).unique(),
    paidAt: timestamp("paid_at", { withTimezone: true }),
    refundedAt: timestamp("refunded_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("payments_order_id_idx").on(table.orderId),
    index("payments_user_id_idx").on(table.userId),
  ]
);

// 通知表
export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    type: varchar("type", { length: 32 }).notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    content: text("content").notNull(),
    data: jsonb("data"),
    isRead: boolean("is_read").default(false).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("notifications_user_id_idx").on(table.userId),
    index("notifications_is_read_idx").on(table.isRead),
  ]
);

// System health check table (Supabase managed)
export const healthCheck = pgTable("health_check", {
  id: integer("id").primaryKey(),
  updatedAt: timestamp("updated_at", { withTimezone: true }),
});
