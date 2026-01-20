import { describe, expect, test } from "bun:test";
import { CancelNotificationSchema, PendingRequestSchema } from "./cancel";

describe("Cancellation Schemas", () => {
	describe("CancelNotificationSchema", () => {
		test("validates notification with string requestId", () => {
			const valid = {
				requestId: "req-123",
				reason: "User cancelled",
			};
			const result = CancelNotificationSchema.safeParse(valid);
			expect(result.success).toBe(true);
		});

		test("validates notification with number requestId", () => {
			const valid = {
				requestId: 42,
			};
			const result = CancelNotificationSchema.safeParse(valid);
			expect(result.success).toBe(true);
		});

		test("validates notification without reason", () => {
			const valid = {
				requestId: "req-456",
			};
			const result = CancelNotificationSchema.safeParse(valid);
			expect(result.success).toBe(true);
		});

		test("rejects missing requestId", () => {
			const invalid = {
				reason: "Some reason",
			};
			const result = CancelNotificationSchema.safeParse(invalid);
			expect(result.success).toBe(false);
		});
	});

	describe("PendingRequestSchema", () => {
		test("validates valid pending request", () => {
			const valid = {
				requestId: "req-789",
				operationId: "123e4567-e89b-12d3-a456-426614174000",
				startedAt: new Date(),
				timeoutMs: 30000,
			};
			const result = PendingRequestSchema.safeParse(valid);
			expect(result.success).toBe(true);
		});

		test("rejects invalid operationId UUID", () => {
			const invalid = {
				requestId: "req-789",
				operationId: "not-a-uuid",
				startedAt: new Date(),
				timeoutMs: 30000,
			};
			const result = PendingRequestSchema.safeParse(invalid);
			expect(result.success).toBe(false);
		});

		test("rejects missing timeoutMs", () => {
			const invalid = {
				requestId: "req-789",
				operationId: "123e4567-e89b-12d3-a456-426614174000",
				startedAt: new Date(),
			};
			const result = PendingRequestSchema.safeParse(invalid);
			expect(result.success).toBe(false);
		});
	});
});
