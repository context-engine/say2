/**
 * Cancellation Types
 *
 * Zod schemas and TypeScript types for Cancellation.
 * Following MCP spec: https://spec.modelcontextprotocol.io/specification/2024-11-05/client/utilities/cancellation/
 */

import { z } from "zod";

/**
 * Notification sent to cancel a request.
 */
export const CancelNotificationSchema = z.object({
    requestId: z.union([z.string(), z.number()]),
    reason: z.string().optional(),
});

export type CancelNotification = z.infer<typeof CancelNotificationSchema>;

/**
 * Tracks a pending request that can be cancelled.
 */
export const PendingRequestSchema = z.object({
    requestId: z.string(),
    operationId: z.string().uuid(),
    startedAt: z.date(),
    timeoutMs: z.number(),
});

export type PendingRequest = z.infer<typeof PendingRequestSchema>;
