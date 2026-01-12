/**
 * Test Helpers
 *
 * Utility functions for MCP package testing.
 */

import {
    type Session,
    SessionManager,
    type MiddlewarePipeline,
    createPipeline,
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
