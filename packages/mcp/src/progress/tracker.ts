/**
 * Progress Tracker
 *
 * Manages progress tokens and notifications for active tool operations.
 * Maps progress tokens to operation IDs for notification routing.
 */

import { v4 as uuidv4 } from "uuid";
import { toolOperationStore } from "../store/operation-store";
import type { ProgressNotification, ProgressUpdate } from "../types/progress";

export class ProgressTracker {
	/** Map: progressToken → operationId */
	private activeTokens = new Map<string, string>();

	/**
	 * Generate a unique progress token.
	 * Format: prog-{timestamp}-{uuid-prefix}
	 */
	generateToken(): string {
		return `prog-${Date.now()}-${uuidv4().slice(0, 8)}`;
	}

	/**
	 * Register an operation for progress tracking.
	 * @param token - The progress token
	 * @param operationId - The operation ID
	 */
	register(token: string, operationId: string): void {
		this.activeTokens.set(token, operationId);
	}

	/**
	 * Handle an incoming progress notification.
	 * Updates the associated operation in the store.
	 * @param notification - The progress notification
	 */
	handleNotification(notification: ProgressNotification): void {
		const token = String(notification.progressToken);
		const operationId = this.activeTokens.get(token);

		if (!operationId) {
			// Ignore notifications for unknown tokens (could be from cancelled ops)
			return;
		}

		const update: ProgressUpdate = {
			id: uuidv4(),
			operationId,
			progress: notification.progress,
			total: notification.total,
			message: notification.message,
			timestamp: new Date(),
		};

		toolOperationStore.updateProgress(operationId, update);
	}

	/**
	 * Unregister a token (cleanup).
	 * Called after tool call completes or is cancelled.
	 * @param token - The progress token
	 */
	unregister(token: string): void {
		this.activeTokens.delete(token);
	}

	/**
	 * Get progress history for an operation.
	 * Delegates to the tool operation store.
	 * @param operationId - The operation ID
	 */
	getProgress(operationId: string): ProgressUpdate[] {
		const operation = toolOperationStore.get(operationId);
		if (!operation || !operation.progressUpdates) {
			return [];
		}
		// Convert the stored progress to full ProgressUpdate objects
		return operation.progressUpdates.map((p, index) => ({
			id: `${operationId}-progress-${index}`,
			operationId,
			progress: p.progress,
			total: p.total,
			message: p.message,
			timestamp: p.timestamp,
		}));
	}

	/**
	 * Check if a token is currently registered (for testing).
	 */
	isRegistered(token: string): boolean {
		return this.activeTokens.has(token);
	}

	/**
	 * Get the number of active tokens (for testing).
	 */
	activeCount(): number {
		return this.activeTokens.size;
	}
}

// Singleton instance
export const progressTracker = new ProgressTracker();
