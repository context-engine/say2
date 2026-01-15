import { describe, expect, it } from "bun:test";
import {
	ToolCallRequestSchema,
	ToolCallResultSchema,
	ToolContentSchema,
	ToolOperationSchema,
} from "./tool";
import {
	AnnotationsSchema,
	AudioContentSchema,
	EmbeddedResourceContentSchema,
	ImageContentSchema,
	ResourceLinkContentSchema,
	TextContentSchema,
} from "./content";

describe("Tool Types Schemas", () => {
	describe("ToolCallRequestSchema", () => {
		it("validates a valid request", () => {
			const valid = {
				name: "testTool",
				arguments: { foo: "bar" },
			};
			expect(ToolCallRequestSchema.parse(valid)).toEqual(valid);
		});

		it("validates request without arguments", () => {
			const valid = {
				name: "noArgs",
			};
			expect(ToolCallRequestSchema.parse(valid)).toEqual(valid);
		});

		it("fails if name is missing", () => {
			const invalid = { arguments: {} };
			expect(() => ToolCallRequestSchema.parse(invalid)).toThrow();
		});
	});

	describe("ToolContentSchema", () => {
		it("validates text content", () => {
			const text = { type: "text", text: "hello" } as const;
			// biome-ignore lint/suspicious/noExplicitAny: generic Zod parse
			const parsed = TextContentSchema.parse(text as any);
			expect(parsed).toEqual(text as any);
			// biome-ignore lint/suspicious/noExplicitAny: generic Zod parse
			expect(ToolContentSchema.parse(text as any)).toEqual(text as any);
		});

		it("validates image content", () => {
			const image = {
				type: "image",
				data: "base64data",
				mimeType: "image/png",
			} as const;
			// biome-ignore lint/suspicious/noExplicitAny: generic Zod parse
			const parsed = ImageContentSchema.parse(image as any);
			expect(parsed).toEqual(image as any);
			// biome-ignore lint/suspicious/noExplicitAny: generic Zod parse
			expect(ToolContentSchema.parse(image as any)).toEqual(image as any);
		});

		it("validates audio content", () => {
			const audio = {
				type: "audio",
				data: "base64audio",
				mimeType: "audio/wav",
			} as const;
			// biome-ignore lint/suspicious/noExplicitAny: generic Zod parse
			const parsed = AudioContentSchema.parse(audio as any);
			expect(parsed).toEqual(audio as any);
			// biome-ignore lint/suspicious/noExplicitAny: generic Zod parse
			expect(ToolContentSchema.parse(audio as any)).toEqual(audio as any);
		});

		it("validates resource link", () => {
			const link = {
				type: "resource_link",
				uri: "file:///test.txt",
			} as const;
			// biome-ignore lint/suspicious/noExplicitAny: generic Zod parse
			const parsed = ResourceLinkContentSchema.parse(link as any);
			expect(parsed).toEqual(link as any);
			// biome-ignore lint/suspicious/noExplicitAny: generic Zod parse
			expect(ToolContentSchema.parse(link as any)).toEqual(link as any);
		});

		it("validates embedded resource", () => {
			const embedded = {
				type: "resource",
				resource: {
					uri: "internal://data",
					text: "content",
				},
			} as const;
			// biome-ignore lint/suspicious/noExplicitAny: generic Zod parse
			const parsed = EmbeddedResourceContentSchema.parse(embedded as any);
			expect(parsed).toEqual(embedded as any);
			// biome-ignore lint/suspicious/noExplicitAny: generic Zod parse
			expect(ToolContentSchema.parse(embedded as any)).toEqual(embedded as any);
		});

		it("fails on invalid content type", () => {
			const invalid = { type: "unknown" };
			expect(() => ToolContentSchema.parse(invalid)).toThrow();
		});
	});

	describe("AnnotationsSchema", () => {
		it("validates correct annotations", () => {
			const valid = {
				audience: ["user"] as ("user" | "assistant")[],
				priority: 0.5,
			};
			expect(AnnotationsSchema.parse(valid)).toEqual(valid);
		});

		it("validates partial annotations", () => {
			const p1 = { audience: ["assistant"] as ("user" | "assistant")[] };
			const p2 = { priority: 1 };
			expect(AnnotationsSchema.parse(p1)).toEqual(p1);
			expect(AnnotationsSchema.parse(p2)).toEqual(p2);
		});

		it("fails on invalid priority range", () => {
			expect(() => AnnotationsSchema.parse({ priority: 1.5 })).toThrow();
			expect(() => AnnotationsSchema.parse({ priority: -0.1 })).toThrow();
		});
	});

	describe("ToolCallResultSchema", () => {
		it("validates result with content", () => {
			const valid = {
				content: [{ type: "text", text: "result" } as const],
			};
			// biome-ignore lint/suspicious/noExplicitAny: generic Zod parse
			expect(ToolCallResultSchema.parse(valid as any)).toEqual(valid as any);
		});

		it("validates result with error", () => {
			const valid = {
				content: [],
				isError: true,
			};
			expect(ToolCallResultSchema.parse(valid)).toEqual(valid);
		});

		it("validates result with structured content", () => {
			const valid = {
				content: [],
				structuredContent: { some: "data" },
			};
			expect(ToolCallResultSchema.parse(valid)).toEqual(valid);
		});
	});

	describe("ToolOperationSchema", () => {
		it("validates full operation structure", () => {
			const op = {
				id: "123e4567-e89b-12d3-a456-426614174000",
				sessionId: "123e4567-e89b-12d3-a456-426614174000",
				requestId: "req-1",
				request: { name: "test" },
				status: "completed",
				startedAt: new Date(),
				completedAt: new Date(),
				result: { content: [] },
			};
			const parsed = ToolOperationSchema.parse(op);
			expect(parsed.id).toBe(op.id);
			expect(parsed.status).toBe("completed");
		});

		it("validates minimal pending operation", () => {
			const op = {
				id: "123e4567-e89b-12d3-a456-426614174000",
				sessionId: "123e4567-e89b-12d3-a456-426614174000",
				requestId: "req-2",
				request: { name: "pending" },
				status: "pending",
				startedAt: new Date(),
			};
			expect(ToolOperationSchema.parse(op)).toBeTruthy();
		});

		it("fails on invalid status enum", () => {
			const invalid = {
				id: "uuid",
				request: { name: "test" },
				status: "unknown_status",
				startedAt: new Date(),
			};
			expect(() => ToolOperationSchema.parse(invalid)).toThrow();
		});
	});

	describe("ToolOperationSchema (Task 03: Progress Fields)", () => {
		it("validates operation with progressToken as string", () => {
			const op = {
				id: "123e4567-e89b-12d3-a456-426614174000",
				sessionId: "123e4567-e89b-12d3-a456-426614174000",
				requestId: "req-1",
				request: { name: "test" },
				status: "pending",
				startedAt: new Date(),
				progressToken: "prog-12345",
			};
			expect(ToolOperationSchema.parse(op)).toBeTruthy();
		});

		it("validates operation with progressToken as number", () => {
			const op = {
				id: "123e4567-e89b-12d3-a456-426614174000",
				sessionId: "123e4567-e89b-12d3-a456-426614174000",
				requestId: "req-1",
				request: { name: "test" },
				status: "pending",
				startedAt: new Date(),
				progressToken: 12345,
			};
			expect(ToolOperationSchema.parse(op)).toBeTruthy();
		});

		it("validates operation with progressUpdates array", () => {
			const op = {
				id: "123e4567-e89b-12d3-a456-426614174000",
				sessionId: "123e4567-e89b-12d3-a456-426614174000",
				requestId: "req-1",
				request: { name: "test" },
				status: "pending",
				startedAt: new Date(),
				progressUpdates: [
					{
						id: "pu-1234-5678-9012-3456",
						operationId: "123e4567-e89b-12d3-a456-426614174000",
						progress: 50,
						total: 100,
						message: "Processing...",
						timestamp: new Date(),
					},
				],
			};
			expect(ToolOperationSchema.parse(op)).toBeTruthy();
		});

		it("defaults progressUpdates to empty array", () => {
			const op = {
				id: "123e4567-e89b-12d3-a456-426614174000",
				sessionId: "123e4567-e89b-12d3-a456-426614174000",
				requestId: "req-1",
				request: { name: "test" },
				status: "pending",
				startedAt: new Date(),
			};
			const parsed = ToolOperationSchema.parse(op);
			expect(parsed.progressUpdates).toEqual([]);
		});
	});

	describe("ToolOperationSchema (Task 04: Cancellation Fields)", () => {
		it("defaults cancelRequested to false", () => {
			const op = {
				id: "123e4567-e89b-12d3-a456-426614174000",
				sessionId: "123e4567-e89b-12d3-a456-426614174000",
				requestId: "req-1",
				request: { name: "test" },
				status: "pending",
				startedAt: new Date(),
			};
			const parsed = ToolOperationSchema.parse(op);
			expect(parsed.cancelRequested).toBe(false);
		});

		it("validates operation with cancelRequested: true", () => {
			const op = {
				id: "123e4567-e89b-12d3-a456-426614174000",
				sessionId: "123e4567-e89b-12d3-a456-426614174000",
				requestId: "req-1",
				request: { name: "test" },
				status: "pending",
				startedAt: new Date(),
				cancelRequested: true,
			};
			expect(ToolOperationSchema.parse(op)).toBeTruthy();
		});

		it("validates operation with cancelReason", () => {
			const op = {
				id: "123e4567-e89b-12d3-a456-426614174000",
				sessionId: "123e4567-e89b-12d3-a456-426614174000",
				requestId: "req-1",
				request: { name: "test" },
				status: "cancelled",
				startedAt: new Date(),
				completedAt: new Date(),
				cancelRequested: true,
				cancelReason: "User requested cancellation",
			};
			expect(ToolOperationSchema.parse(op)).toBeTruthy();
		});

		it("validates operation with all progress and cancel fields", () => {
			const op = {
				id: "123e4567-e89b-12d3-a456-426614174000",
				sessionId: "123e4567-e89b-12d3-a456-426614174000",
				requestId: "req-1",
				request: { name: "test", arguments: { foo: "bar" } },
				status: "completed",
				startedAt: new Date(),
				completedAt: new Date(),
				result: { content: [{ type: "text", text: "done" }] },
				progressToken: "prog-123",
				progressUpdates: [
					{
						id: "pu-1234-5678-9012-3456",
						operationId: "123e4567-e89b-12d3-a456-426614174000",
						progress: 100,
						total: 100,
						message: "Complete",
						timestamp: new Date(),
					},
				],
			};
			const parsed = ToolOperationSchema.parse(op);
			expect(parsed.progressToken).toBe("prog-123");
			expect(parsed.progressUpdates).toHaveLength(1);
		});
	});
});
