/**
 * Message Store
 *
 * In-memory store for MessageEvents with query and correlation support.
 */

import type {
	MessageEvent,
	MessageFilter,
	RequestResponsePair,
} from "../types";

export class MessageStore {
	private messages: Map<string, MessageEvent[]> = new Map();
	private byRequestId: Map<string, MessageEvent> = new Map();

	/**
	 * Store a message event.
	 */
	store(event: MessageEvent): void {
		// Store by session
		const sessionMessages = this.messages.get(event.sessionId) ?? [];
		sessionMessages.push(event);
		this.messages.set(event.sessionId, sessionMessages);

		// Index by requestId for correlation
		if (event.requestId !== undefined) {
			const key = this.makeRequestKey(event.sessionId, event.requestId);
			this.byRequestId.set(key, event);
		}
	}

	/**
	 * Get all messages for a session.
	 */
	getBySession(sessionId: string): MessageEvent[] {
		return this.messages.get(sessionId) ?? [];
	}

	/**
	 * Get a message by request ID.
	 */
	getByRequestId(
		sessionId: string,
		requestId: string | number,
	): MessageEvent | undefined {
		const key = this.makeRequestKey(sessionId, requestId);
		return this.byRequestId.get(key);
	}

	/**
	 * Query messages with filters.
	 */
	query(filter: MessageFilter): MessageEvent[] {
		let results: MessageEvent[];

		if (filter.sessionId) {
			results = this.getBySession(filter.sessionId);
		} else {
			results = Array.from(this.messages.values()).flat();
		}

		// Apply filters
		if (filter.direction) {
			results = results.filter((m) => m.direction === filter.direction);
		}

		if (filter.method) {
			results = results.filter((m) => m.method === filter.method);
		}

		if (filter.hasError !== undefined) {
			results = results.filter((m) => {
				const hasError = "error" in (m.payload as Record<string, unknown>);
				return filter.hasError ? hasError : !hasError;
			});
		}

		if (filter.startTime) {
			results = results.filter((m) => m.timestamp >= filter.startTime!);
		}

		if (filter.endTime) {
			results = results.filter((m) => m.timestamp <= filter.endTime!);
		}

		return results;
	}

	/**
	 * Correlate a request with its response.
	 */
	correlate(
		sessionId: string,
		requestId: string | number,
	): RequestResponsePair | undefined {
		const messages = this.getBySession(sessionId);

		// Find request (outbound with this requestId)
		const request = messages.find(
			(m) => m.direction === "outbound" && m.requestId === requestId,
		);

		if (!request) {
			return undefined;
		}

		// Find response (inbound with same requestId)
		const response = messages.find(
			(m) => m.direction === "inbound" && m.requestId === requestId,
		);

		// Calculate latency
		let latencyMs: number | undefined;
		if (request && response) {
			latencyMs = response.timestamp.getTime() - request.timestamp.getTime();
		}

		return {
			request,
			response,
			latencyMs,
		};
	}

	/**
	 * Get message count for a session.
	 */
	countBySession(sessionId: string): number {
		return this.getBySession(sessionId).length;
	}

	/**
	 * Get total message count.
	 */
	count(): number {
		let total = 0;
		for (const messages of this.messages.values()) {
			total += messages.length;
		}
		return total;
	}

	/**
	 * Clear all messages for a session.
	 */
	clearSession(sessionId: string): void {
		const messages = this.messages.get(sessionId) ?? [];

		// Remove from requestId index
		for (const message of messages) {
			if (message.requestId !== undefined) {
				const key = this.makeRequestKey(sessionId, message.requestId);
				this.byRequestId.delete(key);
			}
		}

		this.messages.delete(sessionId);
	}

	/**
	 * Clear all messages.
	 */
	clear(): void {
		this.messages.clear();
		this.byRequestId.clear();
	}

	private makeRequestKey(
		sessionId: string,
		requestId: string | number,
	): string {
		return `${sessionId}:${requestId}`;
	}
}

// Export singleton instance for convenience
export const messageStore = new MessageStore();
