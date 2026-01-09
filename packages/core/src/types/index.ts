/**
 * Core Types
 *
 * Data models for Say2 core functionality.
 */

import { z } from "zod";

// =============================================================================
// Enums
// =============================================================================

export const SessionState = {
	CREATED: "CREATED",
	INITIALIZING: "INITIALIZING",
	ACTIVE: "ACTIVE",
	CLOSED: "CLOSED",
	ERROR: "ERROR",
} as const;

export type SessionState = (typeof SessionState)[keyof typeof SessionState];

export const Direction = {
	INBOUND: "inbound",
	OUTBOUND: "outbound",
} as const;

export type Direction = (typeof Direction)[keyof typeof Direction];

export const TransportType = {
	STDIO: "stdio",
	HTTP: "http",
} as const;

export type TransportType = (typeof TransportType)[keyof typeof TransportType];

export const Protocol = {
	MCP: "mcp",
	ACP: "acp",
	A2A: "a2a",
} as const;

export type Protocol = (typeof Protocol)[keyof typeof Protocol];

// =============================================================================
// Server Config
// =============================================================================

export const ServerConfigSchema = z.object({
	name: z.string().min(1),
	transport: z.enum(["stdio", "http"]),
	// STDIO transport
	command: z.string().optional(),
	args: z.array(z.string()).optional(),
	env: z.record(z.string(), z.string()).optional(),
	// HTTP transport
	url: z.string().url().optional(),
});

export type ServerConfig = z.infer<typeof ServerConfigSchema>;

// =============================================================================
// Session
// =============================================================================

export const SessionSchema = z.object({
	id: z.string().uuid(),
	state: z.enum(["CREATED", "INITIALIZING", "ACTIVE", "CLOSED", "ERROR"]),
	createdAt: z.date(),
	updatedAt: z.date(),
	config: ServerConfigSchema,
	protocol: z.enum(["mcp", "acp", "a2a"]).default("mcp"),
	protocolVersion: z.string().optional(),
	clientCapabilities: z.record(z.string(), z.unknown()).optional(),
	serverCapabilities: z.record(z.string(), z.unknown()).optional(),
});

export type Session = z.infer<typeof SessionSchema>;

// =============================================================================
// JSON-RPC Message Types
// =============================================================================

export const JsonRpcRequestSchema = z.object({
	jsonrpc: z.literal("2.0"),
	id: z.union([z.string(), z.number()]),
	method: z.string(),
	params: z.unknown().optional(),
});

export type JsonRpcRequest = z.infer<typeof JsonRpcRequestSchema>;

export const JsonRpcResponseSchema = z.object({
	jsonrpc: z.literal("2.0"),
	id: z.union([z.string(), z.number(), z.null()]),
	result: z.unknown().optional(),
	error: z
		.object({
			code: z.number(),
			message: z.string(),
			data: z.unknown().optional(),
		})
		.optional(),
});

export type JsonRpcResponse = z.infer<typeof JsonRpcResponseSchema>;

export const JsonRpcNotificationSchema = z.object({
	jsonrpc: z.literal("2.0"),
	method: z.string(),
	params: z.unknown().optional(),
});

export type JsonRpcNotification = z.infer<typeof JsonRpcNotificationSchema>;

export const JsonRpcMessageSchema = z.union([
	JsonRpcRequestSchema,
	JsonRpcResponseSchema,
	JsonRpcNotificationSchema,
]);

export type JsonRpcMessage = z.infer<typeof JsonRpcMessageSchema>;

// =============================================================================
// Message Event
// =============================================================================

export const MessageEventSchema = z.object({
	id: z.string().uuid(),
	sessionId: z.string().uuid(),
	timestamp: z.date(),
	direction: z.enum(["inbound", "outbound"]),
	protocol: z.enum(["mcp", "acp", "a2a"]).default("mcp"),
	payload: JsonRpcMessageSchema,
	// Derived fields
	method: z.string().optional(),
	requestId: z.union([z.string(), z.number()]).optional(),
	size: z.number().optional(),
});

export type MessageEvent = z.infer<typeof MessageEventSchema>;

// =============================================================================
// Message Filter
// =============================================================================

export const MessageFilterSchema = z.object({
	sessionId: z.string().uuid().optional(),
	direction: z.enum(["inbound", "outbound"]).optional(),
	method: z.string().optional(),
	hasError: z.boolean().optional(),
	startTime: z.date().optional(),
	endTime: z.date().optional(),
});

export type MessageFilter = z.infer<typeof MessageFilterSchema>;

// =============================================================================
// Request-Response Pair
// =============================================================================

export interface RequestResponsePair {
	request: MessageEvent;
	response: MessageEvent | undefined;
	latencyMs: number | undefined;
}

// =============================================================================
// Middleware Types
// =============================================================================

export type NextFn = () => Promise<void>;

export interface MiddlewareContext {
	event: MessageEvent;
	session: Session;
	// Typed extensions
	get<T>(key: ContextKey<T>): T | undefined;
	set<T>(key: ContextKey<T>, value: T): void;
}

export interface ContextKey<T> {
	readonly id: symbol;
	readonly defaultValue?: T;
}

export type Middleware = (
	ctx: MiddlewareContext,
	next: NextFn,
) => Promise<void>;

// =============================================================================
// Factory Functions
// =============================================================================

export function createContextKey<T>(
	name: string,
	defaultValue?: T,
): ContextKey<T> {
	return {
		id: Symbol(name),
		defaultValue,
	};
}

export function createMessageEvent(
	sessionId: string,
	direction: Direction,
	payload: JsonRpcMessage,
	protocol: Protocol = "mcp",
): MessageEvent {
	const id = crypto.randomUUID();
	const timestamp = new Date();

	// Extract method and requestId from payload
	let method: string | undefined;
	let requestId: string | number | undefined;

	if ("method" in payload) {
		method = payload.method;
	}
	if ("id" in payload && payload.id !== null) {
		requestId = payload.id as string | number;
	}

	return {
		id,
		sessionId,
		timestamp,
		direction,
		protocol,
		payload,
		method,
		requestId,
		size: JSON.stringify(payload).length,
	};
}

export function createSession(config: ServerConfig): Session {
	const id = crypto.randomUUID();
	const now = new Date();

	return {
		id,
		state: SessionState.CREATED,
		createdAt: now,
		updatedAt: now,
		config,
		protocol: "mcp",
	};
}
