/**
 * Test Helpers
 *
 * Utility functions for MCP package testing.
 */

import {
	createPipeline,
	type MiddlewarePipeline,
	type Session,
	type SessionManager,
} from "@say2/core";

/**
 * Create a test session with the given configuration.
 */
export async function createTestSession(
	sessionManager: SessionManager,
	config: {
		name?: string;
		transport?: "stdio" | "http";
		command?: string;
		args?: string[];
	} = {},
): Promise<{
	session: Session;
	cleanup: () => Promise<void>;
}> {
	const session = sessionManager.create({
		name: config.name ?? "test-server",
		transport: config.transport ?? "stdio",
		command: config.command ?? "echo",
		args: config.args ?? [],
	});

	return {
		session,
		cleanup: async () => {
			sessionManager.delete(session.id);
		},
	};
}

/**
 * Create a test pipeline with common middlewares.
 */
export function createTestPipeline(): MiddlewarePipeline {
	return createPipeline();
}

/**
 * Wait for a condition to be true.
 */
export async function waitFor(
	condition: () => boolean,
	options: { timeout?: number; interval?: number } = {},
): Promise<void> {
	const { timeout = 5000, interval = 50 } = options;
	const start = Date.now();

	while (!condition()) {
		if (Date.now() - start > timeout) {
			throw new Error(`Timeout waiting for condition after ${timeout}ms`);
		}
		await new Promise((resolve) => setTimeout(resolve, interval));
	}
}

/**
 * Create a promise that resolves after a delay.
 */
export function delay(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Mock Transport Configuration
 */
export interface MockTransportConfig {
	serverConfig?: {
		name?: string;
		version?: string;
		protocolVersion?: string;
		capabilities?: {
			tools?: boolean;
			resources?: boolean;
			prompts?: boolean;
		};
		tools?: Array<{ name: string; description: string }>;
		resources?: Array<{ uri: string; name: string }>;
		prompts?: Array<{ name: string; description: string }>;
		responseDelay?: number;
		failOnMethods?: string[];
		toolsPageSize?: number;
		resourcesPageSize?: number;
	};
}

/**
 * Create a mock MCP transport for testing.
 * Uses the handleMessage function from mock-server to simulate server responses.
 */
export function createMockTransport(config: MockTransportConfig = {}): any {
	const { handleMessage } = require("./mock-server");

	let onmessageHandler: ((msg: any) => void) | undefined;
	let oncloseHandler: (() => void) | undefined;
	let onerrorHandler: ((err: Error) => void) | undefined;

	return {
		async start() {
			// Transport started
		},
		async send(message: any) {
			// Simulate server response
			const response = handleMessage(message, config.serverConfig);
			if (response && onmessageHandler) {
				// Simulate async response
				setTimeout(() => onmessageHandler?.(response), 0);
			}
		},
		async close() {
			oncloseHandler?.();
		},
		get onmessage() {
			return onmessageHandler;
		},
		set onmessage(handler: ((msg: any) => void) | undefined) {
			onmessageHandler = handler;
		},
		get onclose() {
			return oncloseHandler;
		},
		set onclose(handler: (() => void) | undefined) {
			oncloseHandler = handler;
		},
		get onerror() {
			return onerrorHandler;
		},
		set onerror(handler: ((err: Error) => void) | undefined) {
			onerrorHandler = handler;
		},
	};
}
