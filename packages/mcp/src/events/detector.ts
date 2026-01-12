/**
 * EventDetector
 *
 * Static utility for detecting MCP protocol events from JSON-RPC messages.
 * Used by StateMachineMiddleware to trigger state transitions.
 */

import type { JsonRpcMessage } from "@say2/core";

export class EventDetector {
    /**
     * Check if message is an initialize request.
     */
    static isInitializeRequest(msg: JsonRpcMessage): boolean {
        // TODO: Implement
        throw new Error("Not implemented");
    }

    /**
     * Check if message is an initialize response.
     */
    static isInitializeResponse(msg: JsonRpcMessage): boolean {
        // TODO: Implement
        throw new Error("Not implemented");
    }

    /**
     * Check if message is an initialized notification.
     */
    static isInitializedNotification(msg: JsonRpcMessage): boolean {
        // TODO: Implement
        throw new Error("Not implemented");
    }

    /**
     * Check if message is a tools/list response.
     */
    static isToolsListResponse(msg: JsonRpcMessage): boolean {
        // TODO: Implement
        throw new Error("Not implemented");
    }

    /**
     * Extract capabilities from an initialize response.
     */
    static extractCapabilities(
        msg: JsonRpcMessage,
    ): Record<string, unknown> | undefined {
        // TODO: Implement
        throw new Error("Not implemented");
    }

    /**
     * Extract server info from an initialize response.
     */
    static extractServerInfo(
        msg: JsonRpcMessage,
    ): { name: string; version: string } | undefined {
        // TODO: Implement
        throw new Error("Not implemented");
    }
}
