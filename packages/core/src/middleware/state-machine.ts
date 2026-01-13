/**
 * StateMachineMiddleware
 *
 * Middleware that observes protocol messages and triggers appropriate
 * SessionManager state transitions.
 *
 * This middleware bridges the gap between protocol-level events (JSON-RPC messages)
 * and the session state machine. It detects significant protocol events and
 * translates them into SessionManager API calls.
 *
 * Event Detection → State Transition:
 * - `initialize` request (outbound) → sessionManager.initialize()
 * - `initialize` response (inbound) → extract capabilities, store in context
 * - `initialized` notification (outbound) → sessionManager.activate()
 *
 * Design decisions:
 * - Logs warnings on transition failures but does NOT throw (resilient)
 * - Always calls next() to ensure pipeline continues
 * - Does NOT handle `connect` transition (done by McpClientManager)
 * - Uses inline detection to avoid circular dependency with @say2/mcp
 */

import type { SessionManager } from "../session";
import type {
	JsonRpcMessage,
	Middleware,
	MiddlewareContext,
	NextFn,
} from "../types";
import { createContextKey } from "../types";

// ============================================================================
// Inline Protocol Detection
// ============================================================================
// These functions mirror EventDetector from @say2/mcp but are defined here
// to avoid circular dependencies. The middleware is in @say2/core, and
// @say2/mcp depends on @say2/core.
// ============================================================================

function isInitializeRequest(msg: JsonRpcMessage): boolean {
	return "method" in msg && msg.method === "initialize" && "id" in msg;
}

function isInitializeResponse(msg: JsonRpcMessage): boolean {
	if (!("result" in msg)) return false;
	if (typeof msg.result !== "object" || msg.result === null) return false;
	return "protocolVersion" in msg.result;
}

function isInitializedNotification(msg: JsonRpcMessage): boolean {
	return (
		"method" in msg &&
		msg.method === "notifications/initialized" &&
		!("id" in msg)
	);
}

function extractCapabilities(
	msg: JsonRpcMessage,
): Record<string, unknown> | undefined {
	if (!isInitializeResponse(msg)) return undefined;
	if (!("result" in msg)) return undefined;

	const result = msg.result as { capabilities?: Record<string, unknown> };
	return result.capabilities;
}

function extractServerInfo(
	msg: JsonRpcMessage,
): { name: string; version: string } | undefined {
	if (!isInitializeResponse(msg)) return undefined;
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

// ============================================================================
// Context Keys
// ============================================================================

/**
 * Context key for storing server capabilities extracted from initialize response.
 * Used to pass capabilities from response handler to activate call.
 */
export const serverCapabilitiesKey =
	createContextKey<Record<string, unknown>>("serverCapabilities");

/**
 * Context key for storing server info extracted from initialize response.
 */
export const serverInfoKey = createContextKey<{
	name: string;
	version: string;
}>("serverInfo");

/**
 * Context key for storing protocol version from initialize response.
 */
export const protocolVersionKey = createContextKey<string>("protocolVersion");

// ============================================================================
// Middleware Factory
// ============================================================================

/**
 * Create a StateMachineMiddleware instance.
 *
 * @param sessionManager - The SessionManager to use for state transitions
 * @returns A middleware function
 */
export function createStateMachineMiddleware(
	sessionManager: SessionManager,
): Middleware {
	return async (ctx: MiddlewareContext, next: NextFn) => {
		const { event, session } = ctx;
		const payload = event.payload;

		// 1. Initialize request (outbound) - Client sending initialize request
		if (isInitializeRequest(payload) && event.direction === "outbound") {
			const result = sessionManager.initialize(session.id);
			if (!result.success) {
				console.warn(
					`[StateMachineMiddleware] State transition INITIALIZE failed for session ${session.id}: ${result.error}`,
				);
			}
		}

		// 2. Initialize response (inbound) - Server responded with capabilities
		if (isInitializeResponse(payload) && event.direction === "inbound") {
			const serverInfo = extractServerInfo(payload);
			const capabilities = extractCapabilities(payload);

			// Extract protocol version from response
			if ("result" in payload && payload.result) {
				const result = payload.result as {
					protocolVersion?: string;
				};
				if (result.protocolVersion) {
					ctx.set(protocolVersionKey, result.protocolVersion);

					// Validate protocol version
					const SUPPORTED_VERSION = "2024-11-05";
					if (result.protocolVersion !== SUPPORTED_VERSION) {
						const errorMsg = `Protocol version mismatch: expected ${SUPPORTED_VERSION}, got ${result.protocolVersion}`;
						console.warn(
							`[StateMachineMiddleware] ${errorMsg}`,
						);
						sessionManager.markError(session.id, errorMsg);
						// We continue to allow the pipeline to proceed so the message reaches the client,
						// but the session is now in ERROR state.
					}
				}
			}

			// Store in context for use during activate()
			if (serverInfo) {
				ctx.set(serverInfoKey, serverInfo);
			}
			if (capabilities) {
				ctx.set(serverCapabilitiesKey, capabilities);
			}
		}

		// 3. Initialized notification (outbound) - Handshake complete
		if (isInitializedNotification(payload) && event.direction === "outbound") {
			// Retrieve stored capabilities from context
			const serverCaps = ctx.get(serverCapabilitiesKey);
			const protocolVersion = ctx.get(protocolVersionKey);

			const result = sessionManager.activate(
				session.id,
				undefined, // clientCaps - could be extracted from initialize request if stored
				serverCaps,
				protocolVersion,
			);

			if (!result.success) {
				console.warn(
					`[StateMachineMiddleware] State transition ACTIVATE failed for session ${session.id}: ${result.error}`,
				);
			}
		}

		// Always continue to next middleware
		await next();
	};
}
