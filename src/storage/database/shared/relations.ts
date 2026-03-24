import { relations } from "drizzle-orm/relations";
import { users, userProfiles, escortProfiles, orders, hospitals, services, clinicalPathways, messages, reviews, refreshTokens, payments, notifications, digitalEvidences, recoveryMemos } from "./schema";

export const userProfilesRelations = relations(userProfiles, ({one}) => ({
	user: one(users, {
		fields: [userProfiles.userId],
		references: [users.id]
	}),
}));

export const usersRelations = relations(users, ({many}) => ({
	userProfiles: many(userProfiles),
	escortProfiles: many(escortProfiles),
	orders_patientId: many(orders, {
		relationName: "orders_patientId_users_id"
	}),
	orders_escortId: many(orders, {
		relationName: "orders_escortId_users_id"
	}),
	messages_senderId: many(messages, {
		relationName: "messages_senderId_users_id"
	}),
	messages_receiverId: many(messages, {
		relationName: "messages_receiverId_users_id"
	}),
	reviews_authorId: many(reviews, {
		relationName: "reviews_authorId_users_id"
	}),
	reviews_targetId: many(reviews, {
		relationName: "reviews_targetId_users_id"
	}),
	refreshTokens: many(refreshTokens),
	notifications: many(notifications),
}));

export const escortProfilesRelations = relations(escortProfiles, ({one}) => ({
	user: one(users, {
		fields: [escortProfiles.userId],
		references: [users.id]
	}),
}));

export const ordersRelations = relations(orders, ({one, many}) => ({
	user_patientId: one(users, {
		fields: [orders.patientId],
		references: [users.id],
		relationName: "orders_patientId_users_id"
	}),
	user_escortId: one(users, {
		fields: [orders.escortId],
		references: [users.id],
		relationName: "orders_escortId_users_id"
	}),
	hospital: one(hospitals, {
		fields: [orders.hospitalId],
		references: [hospitals.id]
	}),
	service: one(services, {
		fields: [orders.serviceId],
		references: [services.id]
	}),
	clinicalPathway: one(clinicalPathways, {
		fields: [orders.clinicalPathwayId],
		references: [clinicalPathways.id]
	}),
	messages: many(messages),
	reviews: many(reviews),
	payments: many(payments),
	digitalEvidences: many(digitalEvidences),
	recoveryMemos: many(recoveryMemos),
}));

export const hospitalsRelations = relations(hospitals, ({many}) => ({
	orders: many(orders),
}));

export const servicesRelations = relations(services, ({many}) => ({
	orders: many(orders),
}));

export const clinicalPathwaysRelations = relations(clinicalPathways, ({many}) => ({
	orders: many(orders),
}));

export const messagesRelations = relations(messages, ({one}) => ({
	order: one(orders, {
		fields: [messages.orderId],
		references: [orders.id]
	}),
	user_senderId: one(users, {
		fields: [messages.senderId],
		references: [users.id],
		relationName: "messages_senderId_users_id"
	}),
	user_receiverId: one(users, {
		fields: [messages.receiverId],
		references: [users.id],
		relationName: "messages_receiverId_users_id"
	}),
}));

export const reviewsRelations = relations(reviews, ({one}) => ({
	order: one(orders, {
		fields: [reviews.orderId],
		references: [orders.id]
	}),
	user_authorId: one(users, {
		fields: [reviews.authorId],
		references: [users.id],
		relationName: "reviews_authorId_users_id"
	}),
	user_targetId: one(users, {
		fields: [reviews.targetId],
		references: [users.id],
		relationName: "reviews_targetId_users_id"
	}),
}));

export const refreshTokensRelations = relations(refreshTokens, ({one}) => ({
	user: one(users, {
		fields: [refreshTokens.userId],
		references: [users.id]
	}),
}));

export const paymentsRelations = relations(payments, ({one}) => ({
	order: one(orders, {
		fields: [payments.orderId],
		references: [orders.id]
	}),
}));

export const notificationsRelations = relations(notifications, ({one}) => ({
	user: one(users, {
		fields: [notifications.userId],
		references: [users.id]
	}),
}));

export const digitalEvidencesRelations = relations(digitalEvidences, ({one}) => ({
	order: one(orders, {
		fields: [digitalEvidences.orderId],
		references: [orders.id]
	}),
}));

export const recoveryMemosRelations = relations(recoveryMemos, ({one}) => ({
	order: one(orders, {
		fields: [recoveryMemos.orderId],
		references: [orders.id]
	}),
}));