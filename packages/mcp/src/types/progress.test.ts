import { describe, expect, test } from "bun:test";
import {
	ProgressNotificationSchema,
	ProgressTokenSchema,
	ProgressUpdateSchema,
} from "./progress";

describe("Progress Tracking Schemas", () => {
	describe("ProgressTokenSchema", () => {
		test("accepts string token", () => {
			const result = ProgressTokenSchema.safeParse("token-123");
			expect(result.success).toBe(true);
		});

		test("accepts number token", () => {
			const result = ProgressTokenSchema.safeParse(123);
			expect(result.success).toBe(true);
		});

		test("rejects boolean token", () => {
			const result = ProgressTokenSchema.safeParse(true);
			expect(result.success).toBe(false);
		});
	});

	describe("ProgressNotificationSchema", () => {
		test("validates valid notification", () => {
			const valid = {
				progressToken: "t1",
				progress: 50,
				total: 100,
				message: "Halfway there",
			};
			const result = ProgressNotificationSchema.safeParse(valid);
			expect(result.success).toBe(true);
		});

		test("validates minimal notification", () => {
			const minimal = {
				progressToken: 123,
				progress: 10,
			};
			const result = ProgressNotificationSchema.safeParse(minimal);
			expect(result.success).toBe(true);
		});

		test("rejects missing progress", () => {
			const invalid = {
				progressToken: "t1",
				total: 100,
			};
			const result = ProgressNotificationSchema.safeParse(invalid);
			expect(result.success).toBe(false);
		});
	});

	describe("ProgressUpdateSchema", () => {
		test("validates valid update", () => {
			const valid = {
				id: "123e4567-e89b-12d3-a456-426614174000",
				operationId: "123e4567-e89b-12d3-a456-426614174000",
				progress: 25,
				timestamp: new Date(),
			};
			const result = ProgressUpdateSchema.safeParse(valid);
			expect(result.success).toBe(true);
		});

		test("rejects invalid UUID", () => {
			const invalid = {
				id: "not-a-uuid",
				operationId: "123e4567-e89b-12d3-a456-426614174000",
				progress: 25,
				timestamp: new Date(),
			};
			const result = ProgressUpdateSchema.safeParse(invalid);
			expect(result.success).toBe(false);
		});
	});
});
