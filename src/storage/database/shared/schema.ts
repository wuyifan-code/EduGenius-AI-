import { pgTable, unique, uuid, varchar, boolean, timestamp, serial, foreignKey, text, integer, doublePrecision, jsonb, index, pgEnum } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const orderStatus = pgEnum("OrderStatus", ['PENDING', 'PAID', 'CONFIRMED', 'MATCHED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'REFUNDING', 'REFUNDED', 'EVIDENCE_COLLECTING', 'MEMO_GENERATING'])
export const paymentMethod = pgEnum("PaymentMethod", ['STRIPE', 'WECHAT', 'ALIPAY'])
export const paymentStatus = pgEnum("PaymentStatus", ['PENDING', 'COMPLETED', 'REFUNDED', 'FAILED'])
export const refundStatus = pgEnum("RefundStatus", ['PENDING', 'APPROVED', 'REJECTED', 'PROCESSING', 'COMPLETED', 'FAILED'])
export const serviceType = pgEnum("ServiceType", ['FULL_PROCESS', 'APPOINTMENT', 'REPORT_PICKUP', 'VIP_TRANSPORT'])
export const userRole = pgEnum("UserRole", ['GUEST', 'PATIENT', 'ESCORT', 'ADMIN'])


export const users = pgTable("users", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	email: varchar({ length: 255 }).notNull(),
	passwordHash: varchar("password_hash", { length: 255 }).notNull(),
	role: varchar({ length: 32 }).default('GUEST').notNull(),
	isActive: boolean("is_active").default(true).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("users_email_key").on(table.email),
]);

export const healthCheck = pgTable("health_check", {
	id: serial().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
});

export const userProfiles = pgTable("user_profiles", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	name: varchar({ length: 128 }),
	phone: varchar({ length: 32 }),
	avatarUrl: text("avatar_url"),
	bio: text(),
	gender: varchar({ length: 16 }),
	age: integer(),
	verificationNote: text("verification_note"),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "user_profiles_user_id_fkey"
		}).onDelete("cascade"),
	unique("user_profiles_user_id_key").on(table.userId),
]);

export const hospitals = pgTable("hospitals", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	department: varchar({ length: 128 }).notNull(),
	level: varchar({ length: 32 }).notNull(),
	address: varchar({ length: 512 }).notNull(),
	phone: varchar({ length: 32 }),
	rating: doublePrecision(),
	imageUrl: text("image_url"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
});

export const services = pgTable("services", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: varchar({ length: 128 }).notNull(),
	description: text(),
	basePrice: doublePrecision("base_price").notNull(),
	type: varchar({ length: 32 }).notNull(),
	isActive: boolean("is_active").default(true).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
});

export const escortProfiles = pgTable("escort_profiles", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	rating: doublePrecision().default(0).notNull(),
	completedOrders: integer("completed_orders").default(0).notNull(),
	isVerified: boolean("is_verified").default(false).notNull(),
	specialties: text().array().default([""]),
	certificateNo: varchar("certificate_no", { length: 64 }),
	bio: text(),
	hourlyRate: doublePrecision("hourly_rate"),
	latitude: doublePrecision(),
	longitude: doublePrecision(),
	evidenceCount: integer().default(0).notNull(),
	lastEvidenceAt: timestamp("last_evidence_at", { withTimezone: true, mode: 'string' }),
	trustScore: doublePrecision().default(0).notNull(),
	verificationLevel: integer().default(1).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "escort_profiles_user_id_fkey"
		}).onDelete("cascade"),
	unique("escort_profiles_user_id_key").on(table.userId),
]);

export const orders = pgTable("orders", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	patientId: uuid("patient_id").notNull(),
	escortId: uuid("escort_id"),
	hospitalId: uuid("hospital_id").notNull(),
	serviceId: uuid("service_id").notNull(),
	serviceType: varchar("service_type", { length: 32 }).notNull(),
	status: varchar({ length: 32 }).default('PENDING').notNull(),
	price: doublePrecision().notNull(),
	paymentStatus: varchar("payment_status", { length: 32 }).default('PENDING').notNull(),
	appointmentDate: timestamp("appointment_date", { withTimezone: true, mode: 'string' }),
	notes: text(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	clinicalPathwayId: uuid("clinical_pathway_id"),
}, (table) => [
	foreignKey({
			columns: [table.patientId],
			foreignColumns: [users.id],
			name: "orders_patient_id_fkey"
		}),
	foreignKey({
			columns: [table.escortId],
			foreignColumns: [users.id],
			name: "orders_escort_id_fkey"
		}),
	foreignKey({
			columns: [table.hospitalId],
			foreignColumns: [hospitals.id],
			name: "orders_hospital_id_fkey"
		}),
	foreignKey({
			columns: [table.serviceId],
			foreignColumns: [services.id],
			name: "orders_service_id_fkey"
		}),
	foreignKey({
			columns: [table.clinicalPathwayId],
			foreignColumns: [clinicalPathways.id],
			name: "orders_clinical_pathway_id_fkey"
		}).onUpdate("cascade").onDelete("set null"),
]);

export const messages = pgTable("messages", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	orderId: uuid("order_id"),
	senderId: uuid("sender_id").notNull(),
	receiverId: uuid("receiver_id").notNull(),
	content: text().notNull(),
	isRead: boolean("is_read").default(false).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.orderId],
			foreignColumns: [orders.id],
			name: "messages_order_id_fkey"
		}),
	foreignKey({
			columns: [table.senderId],
			foreignColumns: [users.id],
			name: "messages_sender_id_fkey"
		}),
	foreignKey({
			columns: [table.receiverId],
			foreignColumns: [users.id],
			name: "messages_receiver_id_fkey"
		}),
]);

export const reviews = pgTable("reviews", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	orderId: uuid("order_id").notNull(),
	authorId: uuid("author_id").notNull(),
	targetId: uuid("target_id").notNull(),
	rating: integer().notNull(),
	comment: text(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.orderId],
			foreignColumns: [orders.id],
			name: "reviews_order_id_fkey"
		}),
	foreignKey({
			columns: [table.authorId],
			foreignColumns: [users.id],
			name: "reviews_author_id_fkey"
		}),
	foreignKey({
			columns: [table.targetId],
			foreignColumns: [users.id],
			name: "reviews_target_id_fkey"
		}),
]);

export const refreshTokens = pgTable("refresh_tokens", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	token: varchar({ length: 512 }).notNull(),
	expiresAt: timestamp("expires_at", { withTimezone: true, mode: 'string' }).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "refresh_tokens_user_id_fkey"
		}),
	unique("refresh_tokens_user_id_key").on(table.userId),
	unique("refresh_tokens_token_key").on(table.token),
]);

export const payments = pgTable("payments", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	orderId: uuid("order_id").notNull(),
	userId: uuid("user_id").notNull(),
	amount: doublePrecision().notNull(),
	currency: varchar({ length: 8 }).default('cny').notNull(),
	method: varchar({ length: 32 }).notNull(),
	status: varchar({ length: 32 }).default('PENDING').notNull(),
	stripePaymentIntentId: varchar("stripe_payment_intent_id", { length: 128 }),
	wechatOrderId: varchar("wechat_order_id", { length: 128 }),
	paidAt: timestamp("paid_at", { withTimezone: true, mode: 'string' }),
	refundedAt: timestamp("refunded_at", { withTimezone: true, mode: 'string' }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.orderId],
			foreignColumns: [orders.id],
			name: "payments_order_id_fkey"
		}),
	unique("payments_order_id_key").on(table.orderId),
	unique("payments_stripe_payment_intent_id_key").on(table.stripePaymentIntentId),
	unique("payments_wechat_order_id_key").on(table.wechatOrderId),
]);

export const notifications = pgTable("notifications", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	type: varchar({ length: 32 }).notNull(),
	title: varchar({ length: 255 }).notNull(),
	content: text().notNull(),
	data: jsonb(),
	isRead: boolean("is_read").default(false).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "notifications_user_id_fkey"
		}).onDelete("cascade"),
]);

export const clinicalPathways = pgTable("clinical_pathways", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	disease: text().notNull(),
	department: text().notNull(),
	nodes: jsonb().default([]).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
});

export const digitalEvidences = pgTable("digital_evidences", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	orderId: uuid("order_id").notNull(),
	nodeName: text().notNull(),
	type: text().notNull(),
	url: text(),
	content: text(),
	evidenceHash: text(),
	verified: boolean().default(false).notNull(),
	validationScore: doublePrecision(),
	metadata: jsonb(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("digital_evidences_order_id_idx").using("btree", table.orderId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.orderId],
			foreignColumns: [orders.id],
			name: "digital_evidences_order_id_fkey"
		}).onUpdate("cascade").onDelete("cascade"),
	unique("digital_evidences_evidenceHash_key").on(table.evidenceHash),
]);

export const transitStations = pgTable("transit_stations", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: text().notNull(),
	region: text().notNull(),
	address: text().notNull(),
	latitude: doublePrecision(),
	longitude: doublePrecision(),
	isActive: boolean("is_active").default(true).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
});

export const recoveryMemos = pgTable("recovery_memos", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	orderId: uuid("order_id").notNull(),
	content: text().notNull(),
	aiModel: text("ai_model").default('minimax').notNull(),
	status: text().default('generated').notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.orderId],
			foreignColumns: [orders.id],
			name: "recovery_memos_order_id_fkey"
		}).onUpdate("cascade").onDelete("cascade"),
	unique("recovery_memos_order_id_key").on(table.orderId),
]);
