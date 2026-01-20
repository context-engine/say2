/**
 * Task Types
 *
 * Zod schemas and TypeScript types for Task-Augmented Execution.
 * Following MCP spec: https://spec.modelcontextprotocol.io/specification/2025-11-05/tasks/
 */

import { z } from "zod";

// =============================================================================
// Task Status
// =============================================================================

/**
 * Current state of a task.
 */
export const TaskStatusSchema = z.enum([
	"working", // Request currently being processed
	"input_required", // Waiting for elicitation or sampling input
	"completed", // Request completed successfully
	"failed", // Request did not complete successfully
	"cancelled", // Request was cancelled
]);

export type TaskStatus = z.infer<typeof TaskStatusSchema>;

// =============================================================================
// Task Metadata (for request params)
// =============================================================================

/**
 * Metadata to include in task-augmented requests.
 */
export const TaskMetadataSchema = z.object({
	/**
	 * Requested duration in milliseconds to retain task from creation.
	 */
	ttl: z.number().optional(),
});

export type TaskMetadata = z.infer<typeof TaskMetadataSchema>;

// =============================================================================
// Related Task Metadata (for _meta field)
// =============================================================================

/**
 * Metadata linking a message to a task.
 */
export const RelatedTaskMetadataSchema = z.object({
	taskId: z.string(),
});

export type RelatedTaskMetadata = z.infer<typeof RelatedTaskMetadataSchema>;

// =============================================================================
// Task (from tasks/list or tasks/get response)
// =============================================================================

/**
 * Task object representing a long-running operation.
 */
export const TaskSchema = z.object({
	/**
	 * The task identifier (receiver-generated).
	 */
	taskId: z.string(),

	/**
	 * Current task state.
	 */
	status: TaskStatusSchema,

	/**
	 * Optional human-readable message describing current state.
	 */
	statusMessage: z.string().optional(),

	/**
	 * ISO 8601 timestamp when task was created.
	 */
	createdAt: z.string().datetime(),

	/**
	 * ISO 8601 timestamp when task was last updated.
	 */
	lastUpdatedAt: z.string().datetime(),

	/**
	 * Actual retention duration in milliseconds, null for unlimited.
	 */
	ttl: z.number().nullable(),

	/**
	 * Suggested polling interval in milliseconds.
	 */
	pollInterval: z.number().optional(),
});

export type Task = z.infer<typeof TaskSchema>;

// =============================================================================
// CreateTaskResult (initial response to task-augmented request)
// =============================================================================

/**
 * Result returned when a task-augmented call creates a task.
 */
export const CreateTaskResultSchema = z.object({
	/**
	 * The created task (returned instead of CallToolResult).
	 */
	task: TaskSchema,

	/**
	 * Optional metadata.
	 */
	_meta: z.record(z.string(), z.unknown()).optional(),
});

export type CreateTaskResult = z.infer<typeof CreateTaskResultSchema>;

// =============================================================================
// TaskListResult (paginated list response)
// =============================================================================

/**
 * Result from tasks/list request.
 */
export const TaskListResultSchema = z.object({
	tasks: z.array(TaskSchema),
	nextCursor: z.string().optional(),
});

export type TaskListResult = z.infer<typeof TaskListResultSchema>;

// =============================================================================
// TaskGetResult (single task response)
// =============================================================================

/**
 * Result from tasks/get request (same as Task).
 */
export const TaskGetResultSchema = TaskSchema;

export type TaskGetResult = z.infer<typeof TaskGetResultSchema>;

// =============================================================================
// EmptyResult (for cancel response)
// =============================================================================

/**
 * Empty result from tasks/cancel.
 */
export const EmptyResultSchema = z.object({});

export type EmptyResult = z.infer<typeof EmptyResultSchema>;

// =============================================================================
// Task Status Notification (for setNotificationHandler)
// =============================================================================

/**
 * MCP SDK-compatible notification schema with method field.
 * Used for setNotificationHandler to register task status notification handler.
 */
export const TaskStatusNotificationSchema = z.object({
	method: z.literal("notifications/tasks/status"),
	params: TaskSchema,
});

export type TaskStatusNotification = z.infer<
	typeof TaskStatusNotificationSchema
>;
