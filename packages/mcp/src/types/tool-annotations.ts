/**
 * Tool Annotations Types
 *
 * Zod schemas and TypeScript types for Tool Annotations.
 * Following MCP spec: https://spec.modelcontextprotocol.io/specification/2025-11-05/server/tools/
 *
 * NOTE: This is different from ContentAnnotationsSchema (audience/priority) in content.ts.
 * ToolAnnotations are behavioral hints: readOnly, destructive, idempotent, openWorld.
 */

import { z } from "zod";

// =============================================================================
// Tool Annotations Schema (behavioral hints)
// =============================================================================

/**
 * Tool annotations provide behavioral hints about tools.
 * All properties are optional hints - not guaranteed to be accurate.
 *
 * @see https://spec.modelcontextprotocol.io/specification/2025-11-05/server/tools/#tool
 */
export const ToolAnnotationsSchema = z.object({
	/**
	 * A human-readable title for the tool.
	 */
	title: z.string().optional(),

	/**
	 * If true, the tool does not modify its environment.
	 * Default: false
	 */
	readOnlyHint: z.boolean().optional().default(false),

	/**
	 * If true, the tool may perform destructive updates to its environment.
	 * If false, the tool performs only additive updates.
	 * (Meaningful only when readOnlyHint == false)
	 * Default: true
	 */
	destructiveHint: z.boolean().optional().default(true),

	/**
	 * If true, calling the tool repeatedly with the same arguments
	 * will have no additional effect on its environment.
	 * (Meaningful only when readOnlyHint == false)
	 * Default: false
	 */
	idempotentHint: z.boolean().optional().default(false),

	/**
	 * If true, this tool may interact with an "open world" of external entities.
	 * If false, the tool's domain of interaction is closed.
	 * Default: true
	 */
	openWorldHint: z.boolean().optional().default(true),
});

export type ToolAnnotations = z.infer<typeof ToolAnnotationsSchema>;

// =============================================================================
// Tool Execution Schema (for Task 07 - Augmented Tool Execution)
// =============================================================================

/**
 * Tool execution configuration.
 * Stub for Task 07 implementation.
 */
export const ToolExecutionSchema = z.object({
	/**
	 * Whether this tool supports task-based execution.
	 * - 'forbidden': Tool cannot be run as a task
	 * - 'optional': Tool can optionally run as a task
	 * - 'required': Tool must run as a task
	 */
	taskSupport: z.enum(["forbidden", "optional", "required"]).optional(),
});

export type ToolExecution = z.infer<typeof ToolExecutionSchema>;

// =============================================================================
// Icon Schema (optional UI hints)
// =============================================================================

/**
 * Icon for tool display in UIs.
 */
export const IconSchema = z.object({
	/** URL or data URI of the icon */
	src: z.string(),
	/** MIME type of the icon (e.g., "image/png") */
	mimeType: z.string().optional(),
	/** Available sizes (e.g., ["48x48", "96x96"]) */
	sizes: z.array(z.string()).optional(),
});

export type Icon = z.infer<typeof IconSchema>;

// =============================================================================
// Tool Schema (complete Tool interface from MCP SDK)
// =============================================================================

/**
 * Complete Tool definition from MCP.
 * Includes all properties from tools/list response.
 */
export const ToolSchema = z.object({
	/** Unique identifier for the tool */
	name: z.string(),

	/** Human-readable description of functionality */
	description: z.string().optional(),

	/** JSON Schema defining expected parameters */
	inputSchema: z.object({
		type: z.literal("object"),
		properties: z.record(z.string(), z.unknown()).optional(),
		required: z.array(z.string()).optional(),
	}),

	/** Optional JSON Schema defining expected output structure */
	outputSchema: z
		.object({
			type: z.literal("object"),
			properties: z.record(z.string(), z.unknown()).optional(),
			required: z.array(z.string()).optional(),
		})
		.optional(),

	/** Behavioral hints for the tool */
	annotations: ToolAnnotationsSchema.optional(),

	/** Execution configuration (Task 07) */
	execution: ToolExecutionSchema.optional(),

	/** Icons for UI display */
	icons: z.array(IconSchema).optional(),

	/** Additional metadata */
	_meta: z.record(z.string(), z.unknown()).optional(),
});

export type Tool = z.infer<typeof ToolSchema>;

// =============================================================================
// Helper: Apply annotation defaults
// =============================================================================

/**
 * Apply spec-defined defaults to tool annotations.
 * Ensures all hint fields are present with appropriate values.
 *
 * @param annotations - Partial annotations from server (may be undefined)
 * @returns Complete ToolAnnotations with defaults applied
 */
export function applyAnnotationDefaults(
	annotations?: Partial<ToolAnnotations>,
): ToolAnnotations {
	return ToolAnnotationsSchema.parse(annotations ?? {});
}

// =============================================================================
// Helper: Get display name
// =============================================================================

/**
 * Get the display name for a tool following MCP precedence rules.
 * Precedence: annotations.title > name
 *
 * @param tool - Tool object with name and optional annotations
 * @returns The best display name for the tool
 */
export function getToolDisplayName(tool: {
	name: string;
	annotations?: ToolAnnotations;
}): string {
	return tool.annotations?.title ?? tool.name;
}
