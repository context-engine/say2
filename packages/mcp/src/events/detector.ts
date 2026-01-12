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
	 * Initialize requests have method === 'initialize' and an id (they're requests, not notifications).
	 */
	static isInitializeRequest(msg: JsonRpcMessage): boolean {
		return "method" in msg && msg.method === "initialize" && "id" in msg;
	}

	/**
	 * Check if message is an initialize response.
	 * Initialize responses have a 'result' with 'protocolVersion'.
	 */
	static isInitializeResponse(msg: JsonRpcMessage): boolean {
		if (!("result" in msg)) return false;
		if (typeof msg.result !== "object" || msg.result === null) return false;
		return "protocolVersion" in msg.result;
	}

	/**
	 * Check if message is an initialized notification.
	 * This is a notification (no id) with method 'notifications/initialized'.
	 */
	static isInitializedNotification(msg: JsonRpcMessage): boolean {
		return (
			"method" in msg &&
			msg.method === "notifications/initialized" &&
			!("id" in msg)
		);
	}

	/**
	 * Check if message is a tools/list response.
	 * Tools list responses have a 'result' with 'tools' array.
	 */
	static isToolsListResponse(msg: JsonRpcMessage): boolean {
		if (!("result" in msg)) return false;
		if (typeof msg.result !== "object" || msg.result === null) return false;
		return "tools" in msg.result;
	}

	/**
	 * Extract capabilities from an initialize response.
	 * Returns undefined if not an initialize response or capabilities not present.
	 */
	static extractCapabilities(
		msg: JsonRpcMessage,
	): Record<string, unknown> | undefined {
		if (!EventDetector.isInitializeResponse(msg)) return undefined;
		if (!("result" in msg)) return undefined;

		const result = msg.result as { capabilities?: Record<string, unknown> };
		return result.capabilities;
	}

	/**
	 * Extract server info from an initialize response.
	 * Returns undefined if not an initialize response or serverInfo not present.
	 */
	static extractServerInfo(
		msg: JsonRpcMessage,
	): { name: string; version: string } | undefined {
		if (!EventDetector.isInitializeResponse(msg)) return undefined;
		if (!("result" in msg)) return undefined;

		const result = msg.result as {
			serverInfo?: { name: string; version: string };
		};

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
