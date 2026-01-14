/**
 * Tool Operation Store
 *
 * Manages the lifecycle of tool operations.
 * Tracks pending, completed, error, and cancelled operations.
 *
 * Basic execution (create, update, get, getBySession)
 * Progress tracking extensions
 * Cancellation extensions
 */

import { v4 as uuidv4 } from "uuid";
import type {
    ToolCallRequest,
    ToolCallResult,
    ToolOperation,
    JsonRpcError,
} from "../types/tool";
import type { ProgressUpdate } from "../types/progress";

export class ToolOperationStore {
    private operations = new Map<string, ToolOperation>();

    /**
     * Create a new pending tool operation.
     * @param sessionId - The session this operation belongs to
     * @param request - The tool call request
     * @param requestId - The JSON-RPC request ID for correlation
     * @returns The created ToolOperation in pending status
     */
    create(
        sessionId: string,
        request: ToolCallRequest,
        requestId: string,
    ): ToolOperation {
        const id = uuidv4();
        const operation: ToolOperation = {
            id,
            sessionId,
            requestId,
            request,
            status: "pending",
            startedAt: new Date(),
        };

        this.operations.set(operation.id, operation);
        return operation;
    }

    /**
     * Update an existing operation with result, error, or other fields.
     * @param id - The operation ID
     * @param updates - Partial updates to apply
     * @throws Error if operation not found
     */
    update(
        id: string,
        updates: {
            status?: ToolOperation["status"];
            result?: ToolCallResult;
            error?: JsonRpcError;
            progressToken?: string | number;
            cancelReason?: string;
            completedAt?: Date;
        },
    ): void {
        const operation = this.operations.get(id);
        if (!operation) {
            throw new Error(`Tool operation not found: ${id}`);
        }

        if (updates.status) {
            operation.status = updates.status;
        }

        if (updates.result) {
            operation.result = updates.result;
        }

        if (updates.error) {
            operation.error = updates.error;
        }

        // Set completedAt for terminal states
        if (
            updates.status === "completed" ||
            updates.status === "error" ||
            updates.status === "cancelled"
        ) {
            operation.completedAt = new Date();
        }
    }

    /**
     * Add a progress update to an operation.
     * @param id - The operation ID
     * @param update - The progress update
     */
    updateProgress(id: string, update: ProgressUpdate): void {
        const operation = this.operations.get(id);
        if (!operation) {
            throw new Error(`Tool operation not found: ${id}`);
        }

        if (!operation.progress) {
            operation.progress = [];
        }

        operation.progress.push({
            progress: update.progress,
            total: update.total,
            message: update.message,
            timestamp: update.timestamp,
        });
    }

    /**
     * Mark an operation as cancelled.
     * @param id - The operation ID
     * @param reason - Optional cancellation reason
     */
    markCancelled(id: string, reason?: string): void {
        const operation = this.operations.get(id);
        if (!operation) {
            // Operation may have been cleared or never existed - silently ignore
            return;
        }

        // Only mark as cancelled if still pending
        if (operation.status !== "pending") {
            return;
        }

        operation.status = "cancelled";
        if (reason) {
            operation.cancelReason = reason;
        }
        operation.completedAt = new Date();
    }

    /**
     * Get an operation by ID.
     * @param id - The operation ID
     * @returns The operation or undefined if not found
     */
    get(id: string): ToolOperation | undefined {
        return this.operations.get(id);
    }

    /**
     * Get all operations for a session.
     * @param sessionId - The session ID
     * @returns Array of operations for the session
     */
    getBySession(sessionId: string): ToolOperation[] {
        return Array.from(this.operations.values()).filter(
            (op) => op.sessionId === sessionId,
        );
    }

    /**
     * Get an operation by its JSON-RPC request ID.
     * Useful for correlating responses with pending operations.
     * @param requestId - The JSON-RPC request ID
     * @returns The operation or undefined if not found
     */
    getByRequestId(requestId: string): ToolOperation | undefined {
        return Array.from(this.operations.values()).find(
            (op) => op.requestId === requestId,
        );
    }

    /**
     * Clear all operations for a session.
     * Called when session is closed.
     * @param sessionId - The session ID
     */
    clear(sessionId: string): void {
        for (const [id, op] of this.operations.entries()) {
            if (op.sessionId === sessionId) {
                this.operations.delete(id);
            }
        }
    }

    /**
     * Get count of operations (for testing).
     */
    count(): number {
        return this.operations.size;
    }
}

// Singleton instance
export const toolOperationStore = new ToolOperationStore();
