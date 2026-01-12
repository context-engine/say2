/**
 * LoggingTransport
 *
 * Transport decorator that intercepts all messages for observation.
 * Wraps an actual transport and sends messages through the middleware pipeline.
 */

import type { Transport } from "@modelcontextprotocol/sdk/shared/transport.js";
import type { JSONRPCMessage } from "@modelcontextprotocol/sdk/types.js";
import type { MiddlewarePipeline, Session } from "@say2/core";

export class LoggingTransport implements Transport {
    // Transport interface callbacks
    onmessage?: (message: JSONRPCMessage) => void;
    onclose?: () => void;
    onerror?: (error: Error) => void;
    sessionId?: string;

    constructor(
        private wrapped: Transport,
        private session: Session,
        private pipeline: MiddlewarePipeline,
    ) {
        // TODO: Set up wrapped transport callbacks
    }

    /**
     * Start the transport.
     */
    async start(): Promise<void> {
        // TODO: Implement
        throw new Error("Not implemented");
    }

    /**
     * Send a message through the transport.
     * Intercepts, logs, runs through pipeline, then forwards.
     */
    async send(message: JSONRPCMessage): Promise<void> {
        // TODO: Implement
        throw new Error("Not implemented");
    }

    /**
     * Close the transport.
     */
    async close(): Promise<void> {
        // TODO: Implement
        throw new Error("Not implemented");
    }
}
