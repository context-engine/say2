/**
 * EventDetector
 *
 * Specific implementation of ProtocolDetector for MCP protocol.
 * Used by StateMachineMiddleware to trigger state transitions.
 */

import type { JsonRpcMessage, ProtocolDetector } from "@say2/core";

export class McpProtocolDetector implements ProtocolDetector {
	/**
	 * Check if message is an initialize request.
	 * Initialize requests have method === 'initialize' and an id (they're requests, not notifications).
	 */
	isInitializeRequest(msg: JsonRpcMessage): boolean {
		if (!msg || typeof msg !== "object") return false;
		return "method" in msg && msg.method === "initialize" && "id" in msg;
	}

	/**
	 * Check if message is an initialize response.
	 * Initialize responses have a 'result' with 'protocolVersion'.
	 */
	isInitializeResponse(msg: JsonRpcMessage): boolean {
		if (!msg || typeof msg !== "object") return false;
		if (!("result" in msg)) return false;
		if (typeof msg.result !== "object" || msg.result === null) return false;
		return "protocolVersion" in msg.result;
	}

	/**
	 * Check if message is an initialized notification.
	 * This is a notification (no id) with method 'notifications/initialized'.
	 */
	isInitializedNotification(msg: JsonRpcMessage): boolean {
		if (!msg || typeof msg !== "object") return false;
		return (
			"method" in msg &&
			msg.method === "notifications/initialized" &&
			!("id" in msg)
		);
	}

	/**
	 * Check if message is a tools/list response.
	 * (Not part of ProtocolDetector interface but used in tests).
	 */
	isToolsListResponse(msg: JsonRpcMessage): boolean {
		if (!msg || typeof msg !== "object") return false;
		if (!("result" in msg) || !("id" in msg)) return false;
		if (typeof msg.result !== "object" || msg.result === null) return false;
		return "tools" in msg.result && Array.isArray((msg.result as any).tools);
	}

	/**
	 * Extract capabilities from an initialize response.
	 * Returns undefined if not an initialize response or capabilities not present.
	 */
	extractCapabilities(
		msg: JsonRpcMessage,
	): Record<string, unknown> | undefined {
		if (!this.isInitializeResponse(msg)) return undefined;
		if (!("result" in msg)) return undefined;
		const result = msg.result as any;
		if (typeof result !== "object" || result === null) return undefined;
		return result.capabilities;
	}

	/**
	 * Extract server info from an initialize response.
	 * Returns undefined if not an initialize response or serverInfo not present.
	 */
	extractServerInfo(
		msg: JsonRpcMessage,
	): { name: string; version: string } | undefined {
		if (!this.isInitializeResponse(msg)) return undefined;
		if (!("result" in msg)) return undefined;
		const result = msg.result as any;
		if (typeof result !== "object" || result === null) return undefined;

		if (
			result.serverInfo &&
			typeof result.serverInfo.name === "string" &&
			typeof result.serverInfo.version === "string"
		) {
			return result.serverInfo;
		}

		return undefined;
	}
}

export const mcpDetector = new McpProtocolDetector();

/**
 * @deprecated Use McpProtocolDetector instead. Kept for backward compatibility.
 * Exporting the instance as EventDetector to match static-like usage in tests (EventDetector.method).
 */
export const EventDetector = mcpDetector;
