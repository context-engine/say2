/**
 * Middleware Pipeline Tests
 */

import { beforeEach, describe, expect, test } from "bun:test";
import {
	createContextKey,
	createMessageEvent,
	createSession,
	type JsonRpcRequest,
} from "../types";
import { Context, createPipeline, type MiddlewarePipeline } from "./pipeline";

describe("MiddlewarePipeline", () => {
	let pipeline: MiddlewarePipeline;

	beforeEach(() => {
		pipeline = createPipeline();
	});

	function createTestContext() {
		const session = createSession({ name: "test", transport: "stdio" });
		const event = createMessageEvent(session.id, "outbound", {
			jsonrpc: "2.0",
			id: 1,
			method: "test",
		} as JsonRpcRequest);
		return new Context(event, session);
	}

	describe("use", () => {
		test("adds middleware to chain", () => {
			const mw = async (_ctx: unknown, next: () => Promise<void>) => {
				await next();
			};

			pipeline.use(mw);

			expect(pipeline.length).toBe(1);
		});

		test("returns this for chaining", () => {
			const mw = async (_ctx: unknown, next: () => Promise<void>) => {
				await next();
			};

			const result = pipeline.use(mw);

			expect(result).toBe(pipeline);
		});
	});

	describe("run", () => {
		test("middlewares execute in registration order", async () => {
			const order: number[] = [];

			pipeline.use(async (_ctx, next) => {
				order.push(1);
				await next();
			});
			pipeline.use(async (_ctx, next) => {
				order.push(2);
				await next();
			});
			pipeline.use(async (_ctx, next) => {
				order.push(3);
				await next();
			});

			await pipeline.run(createTestContext());

			expect(order).toEqual([1, 2, 3]);
		});

		test("calling next() continues to next middleware", async () => {
			const executed: string[] = [];

			pipeline.use(async (_ctx, next) => {
				executed.push("before-1");
				await next();
				executed.push("after-1");
			});
			pipeline.use(async (_ctx, next) => {
				executed.push("before-2");
				await next();
				executed.push("after-2");
			});

			await pipeline.run(createTestContext());

			expect(executed).toEqual(["before-1", "before-2", "after-2", "after-1"]);
		});

		test("not calling next() stops the chain", async () => {
			const executed: string[] = [];

			pipeline.use(async (_ctx, _next) => {
				executed.push("first");
				// Not calling next()
			});
			pipeline.use(async (_ctx, next) => {
				executed.push("second");
				await next();
			});

			await pipeline.run(createTestContext());

			expect(executed).toEqual(["first"]);
		});

		test("middleware can modify context before calling next()", async () => {
			const key = createContextKey<string>("test");
			let capturedValue: string | undefined;
			let secondMiddlewareExecuted = false;

			pipeline.use(async (ctx, next) => {
				ctx.set(key, "modified");
				await next();
			});
			pipeline.use(async (ctx, next) => {
				secondMiddlewareExecuted = true;
				capturedValue = ctx.get(key);
				await next();
			});

			await pipeline.run(createTestContext());

			// Assert AFTER pipeline.run() to ensure assertions always execute
			expect(secondMiddlewareExecuted).toBe(true);
			expect(capturedValue).toBe("modified");
		});

		test("errors in middleware propagate correctly", async () => {
			pipeline.use(async (_ctx, _next) => {
				throw new Error("Test error");
			});

			await expect(pipeline.run(createTestContext())).rejects.toThrow(
				"Test error",
			);
		});

		test("async middlewares work correctly", async () => {
			const results: string[] = [];

			pipeline.use(async (_ctx, next) => {
				await new Promise((resolve) => setTimeout(resolve, 10));
				results.push("async-1");
				await next();
			});
			pipeline.use(async (_ctx, next) => {
				await new Promise((resolve) => setTimeout(resolve, 5));
				results.push("async-2");
				await next();
			});

			await pipeline.run(createTestContext());

			expect(results).toEqual(["async-1", "async-2"]);
		});
	});

	describe("process", () => {
		test("creates context and runs pipeline", async () => {
			let capturedEvent: unknown;

			pipeline.use(async (ctx, next) => {
				capturedEvent = ctx.event;
				await next();
			});

			const session = createSession({ name: "test", transport: "stdio" });
			const event = createMessageEvent(session.id, "outbound", {
				jsonrpc: "2.0",
				id: 1,
				method: "test",
			} as JsonRpcRequest);

			await pipeline.process(event, session);

			expect(capturedEvent).toBe(event);
		});
	});

	describe("clear", () => {
		test("removes all middlewares", () => {
			pipeline.use(async (_ctx, next) => {
				await next();
			});
			pipeline.use(async (_ctx, next) => {
				await next();
			});

			pipeline.clear();

			expect(pipeline.length).toBe(0);
		});
	});
});

describe("Context", () => {
	test("provides access to event", () => {
		const session = createSession({ name: "test", transport: "stdio" });
		const event = createMessageEvent(session.id, "outbound", {
			jsonrpc: "2.0",
			id: 1,
			method: "test",
		} as JsonRpcRequest);

		const ctx = new Context(event, session);

		expect(ctx.event).toBe(event);
	});

	test("provides access to session", () => {
		const session = createSession({ name: "test", transport: "stdio" });
		const event = createMessageEvent(session.id, "outbound", {
			jsonrpc: "2.0",
			id: 1,
			method: "test",
		} as JsonRpcRequest);

		const ctx = new Context(event, session);

		expect(ctx.session).toBe(session);
	});

	test("get returns undefined for unset key", () => {
		const session = createSession({ name: "test", transport: "stdio" });
		const event = createMessageEvent(session.id, "outbound", {
			jsonrpc: "2.0",
			id: 1,
			method: "test",
		} as JsonRpcRequest);
		const ctx = new Context(event, session);
		const key = createContextKey<string>("missing");

		expect(ctx.get(key)).toBeUndefined();
	});

	test("get returns default value for unset key", () => {
		const session = createSession({ name: "test", transport: "stdio" });
		const event = createMessageEvent(session.id, "outbound", {
			jsonrpc: "2.0",
			id: 1,
			method: "test",
		} as JsonRpcRequest);
		const ctx = new Context(event, session);
		const key = createContextKey<number>("counter", 42);

		expect(ctx.get(key)).toBe(42);
	});

	test("set and get work together", () => {
		const session = createSession({ name: "test", transport: "stdio" });
		const event = createMessageEvent(session.id, "outbound", {
			jsonrpc: "2.0",
			id: 1,
			method: "test",
		} as JsonRpcRequest);
		const ctx = new Context(event, session);
		const key = createContextKey<string>("data");

		ctx.set(key, "hello");

		expect(ctx.get(key)).toBe("hello");
	});
});
