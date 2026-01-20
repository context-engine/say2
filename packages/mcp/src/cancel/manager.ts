/**
 * Cancellation Manager
 *
 * Manages request cancellations, timeouts, and race conditions.
 * Follows MCP spec: https://spec.modelcontextprotocol.io/specification/2024-11-05/client/utilities/cancellation/
 */

import type { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { toolOperationStore } from "../store/operation-store";

interface PendingRequest {
	requestId: string;
	operationId: string;
	startedAt: Date;
	timeoutMs: number;
	timeoutHandle: ReturnType<typeof setTimeout>;
	rejectFn?: (reason: Error) => void;
}

export class CancellationManager {
	// Map: requestId → PendingRequest
	private pendingRequests = new Map<string, PendingRequest>();
	// Reverse lookup: operationId → requestId
	private operationToRequest = new Map<string, string>();
	private defaultTimeoutMs = 30000;
	private client: Client | null = null;

	/**
	 * Set the MCP client to use for sending notifications.
	 */
	setClient(client: Client): void {
		this.client = client;
	}

	/**
	 * Register a request for potential cancellation.
	 * Starts a timeout timer.
	 * @param requestId - The JSON-RPC request ID
	 * @param operationId - The operation ID
	 * @param timeoutMs - Timeout in milliseconds (default 30000)
	 * @param rejectFn - Optional reject function to abort pending promise
	 */
	register(
		requestId: string,
		operationId: string,
		timeoutMs: number = this.defaultTimeoutMs,
		rejectFn?: (reason: Error) => void,
	): void {
		const timeoutHandle = setTimeout(() => {
			this.onTimeout(requestId);
		}, timeoutMs);

		this.pendingRequests.set(requestId, {
			requestId,
			operationId,
			startedAt: new Date(),
			timeoutMs,
			timeoutHandle,
			rejectFn,
		});

		// Reverse lookup for cancel by operationId
		this.operationToRequest.set(operationId, requestId);
	}

	/**
	 * Cancel an operation.
	 * Sends cancellation notification and updates store.
	 * @param operationId - The operation ID
	 * @param reason - Optional cancellation reason
	 */
	async cancel(operationId: string, reason?: string): Promise<void> {
		// Find pending request by operationId
		const requestId = this.operationToRequest.get(operationId);
		if (!requestId) {
			// No pending request - already completed or unknown
			return;
		}

		const entry = this.pendingRequests.get(requestId);
		if (!entry) {
			return;
		}

		// Clear timeout
		clearTimeout(entry.timeoutHandle);

		// Update store first (before sending notification)
		toolOperationStore.markCancelled(operationId, reason);

		// Reject pending promise to abort the callTool await
		if (entry.rejectFn) {
			entry.rejectFn(new Error(reason ?? "Operation cancelled"));
		}

		// Send cancellation notification
		await this.sendCancelNotification(requestId, reason ?? "User cancelled");

		// Remove from pending
		this.pendingRequests.delete(requestId);
		this.operationToRequest.delete(operationId);
	}

	/**
	 * Handle a response arriving for a request.
	 * Clears timeout and removes from pending list.
	 * @param requestId - The JSON-RPC request ID
	 */
	onResponse(requestId: string): void {
		const entry = this.pendingRequests.get(requestId);
		if (!entry) {
			// Already cancelled or unknown — ignore response
			return;
		}

		// Clear timeout and remove
		clearTimeout(entry.timeoutHandle);
		this.pendingRequests.delete(requestId);
		this.operationToRequest.delete(entry.operationId);
	}

	/**
	 * Handle timeout for a request.
	 * @param requestId - The JSON-RPC request ID
	 */
	private onTimeout(requestId: string): void {
		const entry = this.pendingRequests.get(requestId);
		if (!entry) return;

		const reason = "Request timeout";

		// Update store with cancelled status
		toolOperationStore.markCancelled(entry.operationId, reason);

		// Reject pending promise to abort the callTool await
		if (entry.rejectFn) {
			entry.rejectFn(new Error(reason));
		}

		// Send cancel notification (fire and forget)
		this.sendCancelNotification(requestId, reason);

		// Remove from pending
		this.pendingRequests.delete(requestId);
		this.operationToRequest.delete(entry.operationId);
	}

	/**
	 * Send cancellation notification to the server.
	 */
	private async sendCancelNotification(
		requestId: string,
		reason: string,
	): Promise<void> {
		if (!this.client) return;

		await this.client.notification({
			method: "notifications/cancelled",
			params: { requestId, reason },
		});
	}
}

// Singleton instance
export const cancellationManager = new CancellationManager();
