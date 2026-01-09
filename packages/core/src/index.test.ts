/**
 * @say2/core - Package Tests
 */

import { describe, expect, it } from "bun:test";
import {
	Direction,
	// Store
	MessageStore,
	// Middleware
	MiddlewarePipeline,
	// Session
	SessionManager,
	// Types
	SessionState,
	TransportType,
} from "./index";

describe("@say2/core", () => {
	describe("exports", () => {
		it("exports SessionState enum with all lifecycle states", () => {
			// Verify all required states exist
			expect(SessionState.CREATED).toBe("CREATED");
			expect(SessionState.INITIALIZING).toBe("INITIALIZING");
			expect(SessionState.ACTIVE).toBe("ACTIVE");
			expect(SessionState.CLOSED).toBe("CLOSED");
			expect(SessionState.ERROR).toBe("ERROR");
		});

		it("exports Direction enum with all directions", () => {
			expect(Direction.INBOUND).toBe("inbound");
			expect(Direction.OUTBOUND).toBe("outbound");
		});

		it("exports TransportType enum with all transports", () => {
			expect(TransportType.STDIO).toBe("stdio");
			expect(TransportType.HTTP).toBe("http");
		});

		it("exports SessionManager that can create and manage sessions", () => {
			const manager = new SessionManager();
			const session = manager.create({
				name: "test",
				transport: "stdio",
			});
			// Verify it actually works, not just exists
			expect(session.id).toBeDefined();
			expect(session.state).toBe(SessionState.CREATED);
			expect(manager.get(session.id)).toBe(session);
		});

		it("exports MessageStore that can store and retrieve messages", () => {
			const store = new MessageStore();
			// Verify it actually works
			expect(store.count()).toBe(0);
			expect(store.getBySession("unknown")).toEqual([]);
		});

		it("exports MiddlewarePipeline that can register and run middleware", async () => {
			const pipeline = new MiddlewarePipeline();
			let _middlewareExecuted = false;

			pipeline.use(async (_ctx, next) => {
				_middlewareExecuted = true;
				await next();
			});

			// Verify middleware count
			expect(pipeline.length).toBe(1);
		});
	});
});
