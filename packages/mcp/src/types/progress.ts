/**
 * Progress Tracking Types
 *
 * Zod schemas and TypeScript types for Progress Tracking.
 * Following MCP spec: https://spec.modelcontextprotocol.io/specification/2024-11-05/client/utilities/progress/
 */

import { z } from "zod";

/**
 * Progress token used to correlate progress notifications with requests.
 * Can be a string or number.
 */
export const ProgressTokenSchema = z.union([z.string(), z.number()]);

export type ProgressToken = z.infer<typeof ProgressTokenSchema>;

/**
 * Progress notification params received from server.
 */
export const ProgressNotificationSchema = z.object({
    progressToken: ProgressTokenSchema,
    progress: z.number(),
    total: z.number().optional(),
    message: z.string().optional(),
});

export type ProgressNotification = z.infer<typeof ProgressNotificationSchema>;

/**
 * Progress update stored in ToolOperation.
 * Adds timestamp and ID to the raw notification data.
 */
export const ProgressUpdateSchema = z.object({
    id: z.string().uuid(),
    operationId: z.string().uuid(),
    progress: z.number(),
    total: z.number().optional(),
    message: z.string().optional(),
    timestamp: z.date(),
});

export type ProgressUpdate = z.infer<typeof ProgressUpdateSchema>;
