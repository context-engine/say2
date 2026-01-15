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

import { ToolContentSchema } from "./content";
export * from "./content";

// =============================================================================
// Tool Call Definitions
// =============================================================================

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
    progressUpdates: z
        .array(
            z.object({
                progress: z.number(),
                total: z.number().optional(),
                message: z.string().optional(),
                timestamp: z.date(),
            }),
        )
        .default([]),
    // Cancellation
    cancelRequested: z.boolean().default(false),
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
