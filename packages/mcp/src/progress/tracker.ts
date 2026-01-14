/**
 * Progress Tracker
 *
 * Manages progress tokens and notifications for active tool operations.
 */

import type { ProgressNotification, ProgressUpdate } from "../types/progress";

export class ProgressTracker {
    /**
     * Generate a unique progress token.
     */
    generateToken(): string {
        throw new Error("Not implemented: ProgressTracker.generateToken");
    }

    /**
     * Register an operation for progress tracking.
     * @param token - The progress token
     * @param operationId - The operation ID
     */
    register(token: string, operationId: string): void {
        throw new Error("Not implemented: ProgressTracker.register");
    }

    /**
     * Handle an incoming progress notification.
     * Updates the associated operation in the store.
     * @param notification - The progress notification
     */
    handleNotification(notification: ProgressNotification): void {
        throw new Error("Not implemented: ProgressTracker.handleNotification");
    }

    /**
     * Unregister a token (cleanup).
     * @param token - The progress token
     */
    unregister(token: string): void {
        throw new Error("Not implemented: ProgressTracker.unregister");
    }

    /**
     * Get progress history for an operation.
     * @param operationId - The operation ID
     */
    getProgress(operationId: string): ProgressUpdate[] {
        throw new Error("Not implemented: ProgressTracker.getProgress");
    }
}

// Singleton instance
export const progressTracker = new ProgressTracker();
