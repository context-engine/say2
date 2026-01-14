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
        throw new Error("Not implemented: ToolOperationStore.create");
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
        throw new Error("Not implemented: ToolOperationStore.update");
    }

    /**
     * Add a progress update to an operation.
     * @param id - The operation ID
     * @param update - The progress update
     */
    updateProgress(id: string, update: ProgressUpdate): void {
        throw new Error("Not implemented: ToolOperationStore.updateProgress");
    }

    /**
     * Mark an operation as cancelled.
     * @param id - The operation ID
     * @param reason - Optional cancellation reason
     */
    markCancelled(id: string, reason?: string): void {
        throw new Error("Not implemented: ToolOperationStore.markCancelled");
    }

    /**
     * Get an operation by ID.
     * @param id - The operation ID
     * @returns The operation or undefined if not found
     */
    get(id: string): ToolOperation | undefined {
        throw new Error("Not implemented: ToolOperationStore.get");
    }

    /**
     * Get all operations for a session.
     * @param sessionId - The session ID
     * @returns Array of operations for the session
     */
    getBySession(sessionId: string): ToolOperation[] {
        throw new Error("Not implemented: ToolOperationStore.getBySession");
    }

    /**
     * Get an operation by its JSON-RPC request ID.
     * Useful for correlating responses with pending operations.
     * @param requestId - The JSON-RPC request ID
     * @returns The operation or undefined if not found
     */
    getByRequestId(requestId: string): ToolOperation | undefined {
        throw new Error("Not implemented: ToolOperationStore.getByRequestId");
    }

    /**
     * Clear all operations for a session.
     * Called when session is closed.
     * @param sessionId - The session ID
     */
    clear(sessionId: string): void {
        throw new Error("Not implemented: ToolOperationStore.clear");
    }

    /**
     * Get count of operations (for testing).
     */
    count(): number {
        throw new Error("Not implemented: ToolOperationStore.count");
    }
}

// Singleton instance
export const toolOperationStore = new ToolOperationStore();
