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
	Middleware,
	MiddlewareContext,
	NextFn,
	ProtocolDetector,
} from "../types";
import { createContextKey, LATEST_PROTOCOL_VERSION } from "../types";

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
 * @param detector - The ProtocolDetector strategy for parsing messages
 * @returns A middleware function
 */
export function createStateMachineMiddleware(
	sessionManager: SessionManager,
	detector: ProtocolDetector,
): Middleware {
	// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Protocol detection requires sequential checks
	return async (ctx: MiddlewareContext, next: NextFn) => {
		const { event, session } = ctx;
		const payload = event.payload;

		// 1. Initialize request (outbound) - Client sending initialize request
		if (
			detector.isInitializeRequest(payload) &&
			event.direction === "outbound"
		) {
			const result = sessionManager.initialize(session.id);
			if (!result.success) {
				console.warn(
					`[StateMachineMiddleware] State transition INITIALIZE failed for session ${session.id}: ${result.error}`,
				);
			}
		}

		// 2. Initialize response (inbound) - Server responded with capabilities
		if (
			detector.isInitializeResponse(payload) &&
			event.direction === "inbound"
		) {
			const serverInfo = detector.extractServerInfo(payload);
			const capabilities = detector.extractCapabilities(payload);

			// Extract protocol version from response
			if ("result" in payload && payload.result) {
				const result = payload.result as {
					protocolVersion?: string;
				};
				if (result.protocolVersion) {
					ctx.set(protocolVersionKey, result.protocolVersion);

					// Validate protocol version
					if (result.protocolVersion !== LATEST_PROTOCOL_VERSION) {
						const errorMsg = `Protocol version mismatch: expected ${LATEST_PROTOCOL_VERSION}, got ${result.protocolVersion}`;
						console.warn(`[StateMachineMiddleware] ${errorMsg}`);
						sessionManager.markError(session.id, errorMsg);
						// We continue to allow the pipeline to proceed so the message reaches the client,
						// but the session is now in ERROR state.
					}
				}
			}

			// Store in context for use during activate()
			// Validate structure defensively (in case detector returns malformed data)
			if (
				serverInfo &&
				typeof serverInfo.name === "string" &&
				typeof serverInfo.version === "string"
			) {
				ctx.set(serverInfoKey, serverInfo);
			}
			if (capabilities) {
				ctx.set(serverCapabilitiesKey, capabilities);
			}
		}

		// 3. Initialized notification (outbound) - Handshake complete
		if (
			detector.isInitializedNotification(payload) &&
			event.direction === "outbound"
		) {
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
