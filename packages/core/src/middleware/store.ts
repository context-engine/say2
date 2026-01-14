/**
 * StoreMiddleware
 *
 * Simple middleware that stores all message events to the MessageStore.
 * This enables message history, debugging, and replay functionality.
 *
 * Design:
 * - Stores event BEFORE calling next() (ensures storage even if later middleware fails)
 * - Always calls next() (does not stop the chain)
 * - Uses the MessageStore's store() method
 */

import type { MessageStore } from "../store";
import type { Middleware, MiddlewareContext, NextFn } from "../types";

/**
 * Create a StoreMiddleware instance.
 *
 * @param store - The MessageStore to use for storing events
 * @returns A middleware function
 */
export function createStoreMiddleware(store: MessageStore): Middleware {
	return async (ctx: MiddlewareContext, next: NextFn) => {
		// Store the message event
		store.store(ctx.event);

		// Continue to next middleware
		await next();
	};
}
