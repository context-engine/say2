/**
 * Tool Operation Types
 *
 * Zod schemas and TypeScript types for Tool Operations.
 * Following MCP spec: https://spec.modelcontextprotocol.io/specification/2024-11-05/server/tools/
 */

import { z } from "zod";

// =============================================================================
// Content Types
// =============================================================================

/**
 * Supported audio MIME types per MCP spec.
 */
export const AudioMimeTypes = [
    "audio/wav",
    "audio/mp3",
    "audio/mpeg",
    "audio/ogg",
    "audio/webm",
    "audio/flac",
] as const;

/**
 * Supported image MIME types per MCP spec.
 */
export const ImageMimeTypes = [
    "image/png",
    "image/jpeg",
    "image/gif",
    "image/webp",
    "image/svg+xml",
] as const;

/**
 * Annotations for content items.
 * Used to indicate intended audience and priority.
 */
export const AnnotationsSchema = z.object({
    audience: z.array(z.enum(["user", "assistant"])).optional(),
    priority: z.number().min(0).max(1).optional(),
});

export type Annotations = z.infer<typeof AnnotationsSchema>;

/**
 * Text content returned by a tool.
 */
export const TextContentSchema = z.object({
    type: z.literal("text"),
    text: z.string(),
    annotations: AnnotationsSchema.optional(),
});

export type TextContent = z.infer<typeof TextContentSchema>;

/**
 * Image content returned by a tool (base64 encoded).
 */
export const ImageContentSchema = z.object({
    type: z.literal("image"),
    data: z.string(), // base64
    mimeType: z.string(),
    annotations: AnnotationsSchema.optional(),
});

export type ImageContent = z.infer<typeof ImageContentSchema>;

/**
 * Audio content returned by a tool (base64 encoded).
 * Added in later MCP spec versions.
 */
export const AudioContentSchema = z.object({
    type: z.literal("audio"),
    data: z.string(), // base64
    mimeType: z.string(),
    annotations: AnnotationsSchema.optional(),
});

export type AudioContent = z.infer<typeof AudioContentSchema>;

/**
 * Resource link content - a reference to a resource.
 */
export const ResourceLinkContentSchema = z.object({
    type: z.literal("resource_link"),
    uri: z.string(),
    name: z.string().optional(),
    mimeType: z.string().optional(),
    annotations: AnnotationsSchema.optional(),
});

export type ResourceLinkContent = z.infer<typeof ResourceLinkContentSchema>;

/**
 * Embedded resource content - inline resource data.
 */
export const EmbeddedResourceContentSchema = z.object({
    type: z.literal("resource"),
    resource: z.object({
        uri: z.string(),
        text: z.string().optional(),
        blob: z.string().optional(), // base64
        mimeType: z.string().optional(),
    }),
    annotations: AnnotationsSchema.optional(),
});

export type EmbeddedResourceContent = z.infer<
    typeof EmbeddedResourceContentSchema
>;

/**
 * Union of all possible tool content types.
 */
export const ToolContentSchema = z.discriminatedUnion("type", [
    TextContentSchema,
    ImageContentSchema,
    AudioContentSchema,
    ResourceLinkContentSchema,
    EmbeddedResourceContentSchema,
]);

export type ToolContent = z.infer<typeof ToolContentSchema>;

// =============================================================================
// Tool Call Request/Result
// =============================================================================

/**
 * Request to call a tool.
 */
export const ToolCallRequestSchema = z.object({
    name: z.string(),
    arguments: z.record(z.string(), z.unknown()).optional(),
    // _meta is used for progressToken, handled separately
});

export type ToolCallRequest = z.infer<typeof ToolCallRequestSchema>;

/**
 * Result returned from a tool call.
 */
export const ToolCallResultSchema = z.object({
    content: z.array(ToolContentSchema),
    isError: z.boolean().optional(),
    structuredContent: z.unknown().optional(),
});

export type ToolCallResult = z.infer<typeof ToolCallResultSchema>;

// =============================================================================
// Tool Operation (Lifecycle Tracking)
// =============================================================================

/**
 * Status of a tool operation.
 */
export const ToolOperationStatus = {
    PENDING: "pending",
    COMPLETED: "completed",
    ERROR: "error",
    CANCELLED: "cancelled",
} as const;

export type ToolOperationStatus =
    (typeof ToolOperationStatus)[keyof typeof ToolOperationStatus];

/**
 * JSON-RPC error structure.
 */
export const JsonRpcErrorSchema = z.object({
    code: z.number(),
    message: z.string(),
    data: z.unknown().optional(),
});

export type JsonRpcError = z.infer<typeof JsonRpcErrorSchema>;

/**
 * A tool operation tracks the lifecycle of a single tools/call request.
 */
export const ToolOperationSchema = z.object({
    id: z.string().uuid(),
    sessionId: z.string().uuid(),
    requestId: z.string(), // JSON-RPC id for correlation
    request: ToolCallRequestSchema,
    status: z.enum(["pending", "completed", "error", "cancelled"]),
    result: ToolCallResultSchema.optional(),
    error: JsonRpcErrorSchema.optional(),
    startedAt: z.date(),
    completedAt: z.date().optional(),
    // Progress tracking
    progressToken: z.union([z.string(), z.number()]).optional(),
    progress: z
        .array(
            z.object({
                progress: z.number(),
                total: z.number().optional(),
                message: z.string().optional(),
                timestamp: z.date(),
            }),
        )
        .optional(),
    // Cancellation
    cancelReason: z.string().optional(),
});

export type ToolOperation = z.infer<typeof ToolOperationSchema>;

// =============================================================================
// Options and Configuration
// =============================================================================

/**
 * Options for calling a tool.
 */
export interface CallToolOptions {
    /** Timeout in milliseconds. 0 = no timeout. */
    timeout?: number;
    /** Whether to include a progress token for progress tracking. */
    includeProgress?: boolean;
}
