/**
 * LoggingTransport
 *
 * Transport decorator that intercepts all messages for observation.
 * Wraps an actual transport and sends messages through the middleware pipeline.
 *
 * Design:
 * - Outbound messages: send() creates MessageEvent, runs pipeline, then forwards to wrapped transport
 * - Inbound messages: intercepted via wrapped transport's onmessage, creates MessageEvent, runs pipeline, then calls own onmessage
 * - Messages are forwarded UNCHANGED (byte-for-byte preservation)
 * - Pipeline runs BEFORE forwarding (both directions)
 */

import type { Transport } from "@modelcontextprotocol/sdk/shared/transport.js";
import type { JSONRPCMessage } from "@modelcontextprotocol/sdk/types.js";
import {
	createMessageEvent,
	type JsonRpcMessage,
	type MiddlewarePipeline,
	type Session,
} from "@say2/core";

export class LoggingTransport implements Transport {
	// Transport interface callbacks - set by the MCP SDK Client
	onmessage?: (message: JSONRPCMessage) => void;
	onclose?: () => void;
	onerror?: (error: Error) => void;
	sessionId?: string;

	constructor(
		private wrapped: Transport,
		private session: Session,
		private pipeline: MiddlewarePipeline,
	) {
		this.sessionId = session.id;

		// Set up inbound message interception
		this.wrapped.onmessage = async (message: JSONRPCMessage) => {
			await this.interceptInbound(message);
		};

		// Forward close events
		this.wrapped.onclose = () => {
			this.onclose?.();
		};

		// Forward error events
		this.wrapped.onerror = (error: Error) => {
			this.onerror?.(error);
		};
	}

	/**
	 * Start the transport.
	 * Delegates to the wrapped transport.
	 */
	async start(): Promise<void> {
		if (this.wrapped.start) {
			await this.wrapped.start();
		}
	}

	/**
	 * Send a message through the transport.
	 * Intercepts, logs, runs through pipeline, then forwards.
	 */
	async send(message: JSONRPCMessage): Promise<void> {
		// Create outbound message event
		// Cast through unknown to bridge MCP SDK types to our types
		const event = createMessageEvent(
			this.session.id,
			"outbound",
			message as unknown as JsonRpcMessage,
			"mcp",
		);

		// Run through middleware pipeline
		await this.pipeline.process(event, this.session);

		// Forward to actual transport (unchanged)
		if (this.wrapped.send) {
			await this.wrapped.send(message);
		}
	}

	/**
	 * Close the transport.
	 * Delegates to the wrapped transport.
	 */
	async close(): Promise<void> {
		if (this.wrapped.close) {
			await this.wrapped.close();
		}
	}

	/**
	 * Intercept inbound messages from the wrapped transport.
	 */
	private async interceptInbound(message: JSONRPCMessage): Promise<void> {
		// Create inbound message event
		// Cast through unknown to bridge MCP SDK types to our types
		const event = createMessageEvent(
			this.session.id,
			"inbound",
			message as unknown as JsonRpcMessage,
			"mcp",
		);

		// Run through middleware pipeline
		await this.pipeline.process(event, this.session);

		// Forward to the registered handler (unchanged)
		this.onmessage?.(message);
	}
}
