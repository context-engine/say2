/**
 * Tool Annotations Schema Tests
 *
 * Unit tests for ToolAnnotationsSchema, ToolSchema, and helper functions.
 * Task 06: Tool Annotations - Phase 1 Schema Tests
 */

import { describe, expect, it } from "bun:test";
import {
	applyAnnotationDefaults,
	getToolDisplayName,
	IconSchema,
	type Tool,
	type ToolAnnotations,
	ToolAnnotationsSchema,
	ToolExecutionSchema,
	ToolSchema,
} from "./tool-annotations";

describe("ToolAnnotationsSchema", () => {
	describe("field parsing", () => {
		it("parses title annotation", () => {
			const annotations = { title: "My Tool Title" };
			const parsed = ToolAnnotationsSchema.parse(annotations);
			expect(parsed.title).toBe("My Tool Title");
		});

		it("parses readOnlyHint with default false", () => {
			const parsed = ToolAnnotationsSchema.parse({});
			expect(parsed.readOnlyHint).toBe(false);
		});

		it("parses readOnlyHint when explicitly true", () => {
			const parsed = ToolAnnotationsSchema.parse({ readOnlyHint: true });
			expect(parsed.readOnlyHint).toBe(true);
		});

		it("parses destructiveHint with default true", () => {
			const parsed = ToolAnnotationsSchema.parse({});
			expect(parsed.destructiveHint).toBe(true);
		});

		it("parses destructiveHint when explicitly false", () => {
			const parsed = ToolAnnotationsSchema.parse({ destructiveHint: false });
			expect(parsed.destructiveHint).toBe(false);
		});

		it("parses idempotentHint with default false", () => {
			const parsed = ToolAnnotationsSchema.parse({});
			expect(parsed.idempotentHint).toBe(false);
		});

		it("parses idempotentHint when explicitly true", () => {
			const parsed = ToolAnnotationsSchema.parse({ idempotentHint: true });
			expect(parsed.idempotentHint).toBe(true);
		});

		it("parses openWorldHint with default true", () => {
			const parsed = ToolAnnotationsSchema.parse({});
			expect(parsed.openWorldHint).toBe(true);
		});

		it("parses openWorldHint when explicitly false", () => {
			const parsed = ToolAnnotationsSchema.parse({ openWorldHint: false });
			expect(parsed.openWorldHint).toBe(false);
		});
	});

	describe("partial and empty annotations", () => {
		it("handles empty annotations with all defaults", () => {
			const parsed = ToolAnnotationsSchema.parse({});
			expect(parsed).toEqual({
				readOnlyHint: false,
				destructiveHint: true,
				idempotentHint: false,
				openWorldHint: true,
			});
		});

		it("handles partial annotations - only title", () => {
			const parsed = ToolAnnotationsSchema.parse({ title: "Just a title" });
			expect(parsed.title).toBe("Just a title");
			expect(parsed.readOnlyHint).toBe(false);
			expect(parsed.destructiveHint).toBe(true);
		});

		it("handles partial annotations - only boolean hints", () => {
			const parsed = ToolAnnotationsSchema.parse({
				readOnlyHint: true,
				idempotentHint: true,
			});
			expect(parsed.title).toBeUndefined();
			expect(parsed.readOnlyHint).toBe(true);
			expect(parsed.destructiveHint).toBe(true); // default
			expect(parsed.idempotentHint).toBe(true);
			expect(parsed.openWorldHint).toBe(true); // default
		});
	});

	describe("invalid type rejection", () => {
		it("rejects non-boolean readOnlyHint", () => {
			expect(() =>
				ToolAnnotationsSchema.parse({ readOnlyHint: "yes" }),
			).toThrow();
		});

		it("rejects non-boolean destructiveHint", () => {
			expect(() =>
				ToolAnnotationsSchema.parse({ destructiveHint: 1 }),
			).toThrow();
		});

		it("rejects non-string title", () => {
			expect(() => ToolAnnotationsSchema.parse({ title: 123 })).toThrow();
		});

		it("rejects non-boolean idempotentHint", () => {
			expect(() =>
				ToolAnnotationsSchema.parse({ idempotentHint: null }),
			).toThrow();
		});

		it("rejects non-boolean openWorldHint", () => {
			expect(() =>
				ToolAnnotationsSchema.parse({ openWorldHint: {} }),
			).toThrow();
		});
	});
});

describe("applyAnnotationDefaults", () => {
	it("applies defaults to undefined", () => {
		const result = applyAnnotationDefaults(undefined);
		expect(result).toEqual({
			readOnlyHint: false,
			destructiveHint: true,
			idempotentHint: false,
			openWorldHint: true,
		});
	});

	it("applies defaults to empty object", () => {
		const result = applyAnnotationDefaults({});
		expect(result).toEqual({
			readOnlyHint: false,
			destructiveHint: true,
			idempotentHint: false,
			openWorldHint: true,
		});
	});

	it("preserves provided values", () => {
		const result = applyAnnotationDefaults({
			title: "Custom Title",
			readOnlyHint: true,
		});
		expect(result.title).toBe("Custom Title");
		expect(result.readOnlyHint).toBe(true);
		expect(result.destructiveHint).toBe(true); // default
	});

	it("preserves all explicit values", () => {
		const input: Partial<ToolAnnotations> = {
			title: "Full Override",
			readOnlyHint: true,
			destructiveHint: false,
			idempotentHint: true,
			openWorldHint: false,
		};
		const result = applyAnnotationDefaults(input);
		expect(result).toEqual(input as ToolAnnotations);
	});
});

describe("getToolDisplayName", () => {
	it("returns annotations.title when present", () => {
		const tool = {
			name: "my_tool",
			annotations: { title: "My Tool Display Name" } as ToolAnnotations,
		};
		expect(getToolDisplayName(tool)).toBe("My Tool Display Name");
	});

	it("falls back to name when title is undefined", () => {
		const tool = {
			name: "fallback_tool",
			annotations: {} as ToolAnnotations,
		};
		expect(getToolDisplayName(tool)).toBe("fallback_tool");
	});

	it("falls back to name when annotations is undefined", () => {
		const tool = { name: "no_annotations_tool" };
		expect(getToolDisplayName(tool)).toBe("no_annotations_tool");
	});

	it("prefers title over name", () => {
		const tool = {
			name: "internal_name",
			annotations: {
				title: "User-Friendly Title",
				readOnlyHint: false,
				destructiveHint: true,
				idempotentHint: false,
				openWorldHint: true,
			},
		};
		expect(getToolDisplayName(tool)).toBe("User-Friendly Title");
	});
});

describe("ToolExecutionSchema", () => {
	it("validates taskSupport: forbidden", () => {
		const parsed = ToolExecutionSchema.parse({ taskSupport: "forbidden" });
		expect(parsed.taskSupport).toBe("forbidden");
	});

	it("validates taskSupport: optional", () => {
		const parsed = ToolExecutionSchema.parse({ taskSupport: "optional" });
		expect(parsed.taskSupport).toBe("optional");
	});

	it("validates taskSupport: required", () => {
		const parsed = ToolExecutionSchema.parse({ taskSupport: "required" });
		expect(parsed.taskSupport).toBe("required");
	});

	it("allows empty object (all optional)", () => {
		const parsed = ToolExecutionSchema.parse({});
		expect(parsed.taskSupport).toBeUndefined();
	});

	it("rejects invalid taskSupport value", () => {
		expect(() =>
			ToolExecutionSchema.parse({ taskSupport: "always" }),
		).toThrow();
	});
});

describe("IconSchema", () => {
	it("validates icon with src only", () => {
		const parsed = IconSchema.parse({ src: "https://example.com/icon.png" });
		expect(parsed.src).toBe("https://example.com/icon.png");
		expect(parsed.mimeType).toBeUndefined();
		expect(parsed.sizes).toBeUndefined();
	});

	it("validates icon with all fields", () => {
		const icon = {
			src: "data:image/png;base64,abc123",
			mimeType: "image/png",
			sizes: ["48x48", "96x96"],
		};
		const parsed = IconSchema.parse(icon);
		expect(parsed).toEqual(icon);
	});

	it("rejects missing src", () => {
		expect(() => IconSchema.parse({ mimeType: "image/png" })).toThrow();
	});

	it("rejects non-string src", () => {
		expect(() => IconSchema.parse({ src: 123 })).toThrow();
	});
});

describe("ToolSchema", () => {
	const minimalTool = {
		name: "test_tool",
		inputSchema: { type: "object" as const },
	};

	it("validates minimal tool definition", () => {
		const parsed = ToolSchema.parse(minimalTool);
		expect(parsed.name).toBe("test_tool");
		expect(parsed.inputSchema.type).toBe("object");
	});

	it("validates tool with description", () => {
		const tool = { ...minimalTool, description: "A test tool" };
		const parsed = ToolSchema.parse(tool);
		expect(parsed.description).toBe("A test tool");
	});

	it("validates tool with annotations", () => {
		const tool = {
			...minimalTool,
			annotations: {
				title: "Test Tool",
				readOnlyHint: true,
			},
		};
		const parsed = ToolSchema.parse(tool);
		expect(parsed.annotations?.title).toBe("Test Tool");
		expect(parsed.annotations?.readOnlyHint).toBe(true);
	});

	it("validates tool with outputSchema", () => {
		const tool = {
			...minimalTool,
			outputSchema: {
				type: "object" as const,
				properties: { result: { type: "string" } },
			},
		};
		const parsed = ToolSchema.parse(tool);
		expect(parsed.outputSchema?.type).toBe("object");
	});

	it("validates tool with execution config", () => {
		const tool = {
			...minimalTool,
			execution: { taskSupport: "optional" as const },
		};
		const parsed = ToolSchema.parse(tool);
		expect(parsed.execution?.taskSupport).toBe("optional");
	});

	it("validates tool with icons", () => {
		const tool = {
			...minimalTool,
			icons: [
				{ src: "https://example.com/icon.svg", mimeType: "image/svg+xml" },
			],
		};
		const parsed = ToolSchema.parse(tool);
		expect(parsed.icons).toHaveLength(1);
		expect(parsed.icons?.[0]?.src).toBe("https://example.com/icon.svg");
	});

	it("validates tool with _meta", () => {
		const tool = {
			...minimalTool,
			_meta: { version: "1.0", author: "test" },
		};
		const parsed = ToolSchema.parse(tool);
		expect(parsed._meta?.version).toBe("1.0");
	});

	it("validates complete tool with all fields", () => {
		const completeTool: Tool = {
			name: "complete_tool",
			description: "A fully specified tool",
			inputSchema: {
				type: "object",
				properties: { input: { type: "string" } },
				required: ["input"],
			},
			outputSchema: {
				type: "object",
				properties: { output: { type: "number" } },
			},
			annotations: {
				title: "Complete Tool",
				readOnlyHint: true,
				destructiveHint: false,
				idempotentHint: true,
				openWorldHint: false,
			},
			execution: { taskSupport: "required" },
			icons: [{ src: "/icon.png" }],
			_meta: { custom: "data" },
		};
		const parsed = ToolSchema.parse(completeTool);
		expect(parsed.name).toBe("complete_tool");
		expect(parsed.annotations?.title).toBe("Complete Tool");
	});

	it("rejects tool without name", () => {
		expect(() =>
			ToolSchema.parse({ inputSchema: { type: "object" } }),
		).toThrow();
	});

	it("rejects tool without inputSchema", () => {
		expect(() => ToolSchema.parse({ name: "no_schema" })).toThrow();
	});

	it("rejects tool with invalid inputSchema type", () => {
		expect(() =>
			ToolSchema.parse({ name: "bad_schema", inputSchema: { type: "array" } }),
		).toThrow();
	});
});

describe("Phase 3: Edge Cases & Validation", () => {
	it("strips unknown annotation fields", () => {
		const result = ToolAnnotationsSchema.parse({
			title: "Test",
			unknownField: "should be stripped",
		});
		// biome-ignore lint/suspicious/noExplicitAny: testing stripper
		expect((result as any).unknownField).toBeUndefined();
		expect(result.title).toBe("Test");
	});

	it("safeParse handles invalid types gracefully", () => {
		const result = ToolAnnotationsSchema.safeParse({
			readOnlyHint: "not a boolean",
		});
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error?.issues[0]?.code).toBe("invalid_type");
			expect(result.error?.issues[0]?.path).toContain("readOnlyHint");
		}
	});

	it("handles null vs undefined gracefully", () => {
		// undefined -> uses default
		const res1 = ToolAnnotationsSchema.parse({
			readOnlyHint: undefined,
		});
		expect(res1.readOnlyHint).toBe(false);

		// null -> invalid type (Zod default behavior for boolean is strict)
		const res2 = ToolAnnotationsSchema.safeParse({
			readOnlyHint: null,
		});
		expect(res2.success).toBe(false);
	});

	it("validates complex real-world annotations combination", () => {
		const complex = {
			title: "Production Tool",
			readOnlyHint: true,
			destructiveHint: false, // Explicit override
			idempotentHint: true,
			openWorldHint: false,
			extraMetadata: {
				source: "registry",
				verified: true,
			},
		};

		const result = ToolAnnotationsSchema.parse(complex);

		expect(result).toEqual({
			title: "Production Tool",
			readOnlyHint: true,
			destructiveHint: false,
			idempotentHint: true,
			openWorldHint: false,
		});
		// Verify extra fields are stripped
		// biome-ignore lint/suspicious/noExplicitAny: testing stripper
		expect((result as any).extraMetadata).toBeUndefined();
	});
});
