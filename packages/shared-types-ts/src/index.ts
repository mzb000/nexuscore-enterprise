import { z } from "zod";

// Shared User Types
export const UserRoleSchema = z.enum([
  "SUPER_ADMIN",
  "ADMIN",
  "VENDOR",
  "CUSTOMER",
  "SERVICE_ACCOUNT",
]);
export type UserRole = z.infer<typeof UserRoleSchema>;

// Shared Order Status
export const OrderStatusSchema = z.enum([
  "PENDING",
  "STOCK_RESERVED",
  "PAYMENT_AUTHORIZED",
  "CONFIRMED",
  "CANCELLED",
  "FAILED",
]);
export type OrderStatus = z.infer<typeof OrderStatusSchema>;

// Shared Money / Currency
export const MoneySchema = z.object({
  amount: z.number().positive(),
  currency: z.string().length(3),
});
export type Money = z.infer<typeof MoneySchema>;

// Shared Event Envelope for Kafka
export const DomainEventEnvelopeSchema = z.object({
  eventId: z.string().uuid(),
  eventType: z.string(),
  aggregateId: z.string(),
  aggregateType: z.string(),
  timestamp: z.string().datetime(),
  payload: z.record(z.any()),
});
export type DomainEventEnvelope = z.infer<typeof DomainEventEnvelopeSchema>;
