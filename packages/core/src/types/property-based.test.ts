/**
 * Property-Based Tests for Core Types
 *
 * These tests use fast-check to generate random inputs and verify
 * that properties hold for ALL possible inputs, not just specific examples.
 *
 * Property-based testing catches edge cases that example-based tests miss.
 */

import { describe, expect, test } from "bun:test";
import fc from "fast-check";
import {
	createContextKey,
	createMessageEvent,
	createSession,
	Direction,
	type JsonRpcRequest,
	SessionState,
} from "./index";

describe("Property-Based Tests", () => {
	describe("createSession", () => {
		test("always creates unique IDs for any config", () => {
			fc.assert(
				fc.property(
					fc.record({
						name: fc.string({ minLength: 1, maxLength: 100 }),
						transport: fc.constantFrom("stdio", "http"),
					}),
					(config) => {
						const session1 = createSession(
							config as { name: string; transport: "stdio" | "http" },
						);
						const session2 = createSession(
							config as { name: string; transport: "stdio" | "http" },
						);

						// Property: IDs must always be unique
						return session1.id !== session2.id;
					},
				),
				{ numRuns: 100 },
			);
		});

		test("always starts in CREATED state regardless of config", () => {
			fc.assert(
				fc.property(
					fc.record({
						name: fc.string({ minLength: 1 }),
						transport: fc.constantFrom("stdio", "http"),
						// Optional fields
						host: fc.option(fc.string()),
						port: fc.option(fc.integer({ min: 1, max: 65535 })),
					}),
					(config) => {
						const session = createSession(
							config as { name: string; transport: "stdio" | "http" },
						);

						// Property: Initial state is always CREATED
						return session.state === SessionState.CREATED;
					},
				),
				{ numRuns: 100 },
			);
		});

		test("preserves config reference for any valid config", () => {
			fc.assert(
				fc.property(
					fc.record({
						name: fc.string({ minLength: 1, maxLength: 50 }),
						transport: fc.constantFrom("stdio", "http"),
					}),
					(config) => {
						const typedConfig = config as {
							name: string;
							transport: "stdio" | "http";
						};
						const session = createSession(typedConfig);

						// Property: Config reference is preserved
						return session.config === typedConfig;
					},
				),
				{ numRuns: 100 },
			);
		});
	});

	describe("createMessageEvent", () => {
		test("always generates valid UUID for any payload", () => {
			const uuidRegex =
				/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

			fc.assert(
				fc.property(
					fc.uuid(),
					fc.constantFrom("inbound", "outbound"),
					fc.record({
						jsonrpc: fc.constant("2.0"),
						id: fc.option(fc.oneof(fc.integer(), fc.string())),
						method: fc.option(fc.string()),
						result: fc.option(fc.anything()),
					}),
					(sessionId, direction, payload) => {
						const event = createMessageEvent(
							sessionId,
							direction as "inbound" | "outbound",
							payload,
						);

						// Property: ID is always a valid UUID
						return uuidRegex.test(event.id);
					},
				),
				{ numRuns: 100 },
			);
		});

		test("preserves sessionId for any input", () => {
			fc.assert(
				fc.property(
					fc.uuid(),
					fc.constantFrom("inbound", "outbound"),
					fc.record({
						jsonrpc: fc.constant("2.0" as const),
						id: fc.integer({ min: 1 }),
						method: fc.string({ minLength: 1 }),
					}),
					(sessionId, direction, payload) => {
						const event = createMessageEvent(
							sessionId,
							direction as "inbound" | "outbound",
							payload as JsonRpcRequest,
						);

						// Property: sessionId is always preserved
						return event.sessionId === sessionId;
					},
				),
				{ numRuns: 100 },
			);
		});

		test("direction is always preserved", () => {
			fc.assert(
				fc.property(
					fc.uuid(),
					fc.constantFrom("inbound", "outbound"),
					fc.record({
						jsonrpc: fc.constant("2.0" as const),
						id: fc.integer({ min: 1 }),
						method: fc.string({ minLength: 1 }),
					}),
					(sessionId, direction, payload) => {
						const event = createMessageEvent(
							sessionId,
							direction as "inbound" | "outbound",
							payload as JsonRpcRequest,
						);

						// Property: Direction is always preserved
						return event.direction === direction;
					},
				),
				{ numRuns: 100 },
			);
		});

		test("size is always non-negative for any payload", () => {
			fc.assert(
				fc.property(
					fc.uuid(),
					fc.constantFrom("inbound", "outbound"),
					fc.record({
						jsonrpc: fc.constant("2.0" as const),
						id: fc.integer({ min: 1 }),
						method: fc.string({ minLength: 1 }),
					}),
					(sessionId, direction, payload) => {
						const event = createMessageEvent(
							sessionId,
							direction as "inbound" | "outbound",
							payload as JsonRpcRequest,
						);

						// Property: Size is always non-negative
						return (event.size ?? 0) >= 0;
					},
				),
				{ numRuns: 100 },
			);
		});

		test("extracts method from payload when present", () => {
			fc.assert(
				fc.property(
					fc.uuid(),
					fc.constantFrom("inbound", "outbound"),
					fc.string({ minLength: 1, maxLength: 50 }),
					(sessionId, direction, methodName) => {
						const payload: JsonRpcRequest = {
							jsonrpc: "2.0",
							method: methodName,
							id: 1,
						};
						const event = createMessageEvent(
							sessionId,
							direction as "inbound" | "outbound",
							payload,
						);

						// Property: Method is extracted correctly
						return event.method === methodName;
					},
				),
				{ numRuns: 100 },
			);
		});

		test("extracts requestId from payload when present", () => {
			fc.assert(
				fc.property(
					fc.uuid(),
					fc.constantFrom("inbound", "outbound"),
					fc.oneof(fc.integer({ min: 1, max: 1000000 }), fc.uuid()),
					(sessionId, direction, requestId) => {
						const payload: JsonRpcRequest = {
							jsonrpc: "2.0",
							id: requestId,
							method: "test",
						};
						const event = createMessageEvent(
							sessionId,
							direction as "inbound" | "outbound",
							payload,
						);

						// Property: requestId is extracted correctly
						return event.requestId === requestId;
					},
				),
				{ numRuns: 100 },
			);
		});
	});

	describe("createContextKey", () => {
		test("always creates unique symbols for same name", () => {
			fc.assert(
				fc.property(fc.string({ minLength: 1, maxLength: 50 }), (name) => {
					const key1 = createContextKey<string>(name);
					const key2 = createContextKey<string>(name);

					// Property: Each key has a unique symbol even with same name
					return key1.id !== key2.id;
				}),
				{ numRuns: 100 },
			);
		});

		test("preserves default value for any type", () => {
			fc.assert(
				fc.property(
					fc.string({ minLength: 1 }),
					fc.jsonValue(),
					(name, defaultValue) => {
						const key = createContextKey(name, defaultValue);

						// Property: Default value is preserved
						return key.defaultValue === defaultValue;
					},
				),
				{ numRuns: 100 },
			);
		});
	});

	describe("Direction enum", () => {
		test("contains only valid direction values", () => {
			const validDirections = ["inbound", "outbound"];

			// Property: All Direction values are in the valid set
			expect(
				Object.values(Direction).every((d) => validDirections.includes(d)),
			).toBe(true);
			// Property: Has exactly 2 directions
			expect(Object.values(Direction).length).toBe(2);
		});
	});

	describe("SessionState enum", () => {
		test("contains expected lifecycle states", () => {
			const expectedStates = [
				"CREATED",
				"INITIALIZING",
				"ACTIVE",
				"CLOSED",
				"ERROR",
			];

			// Property: All expected states exist
			expect(
				expectedStates.every((s) =>
					Object.values(SessionState).includes(s as SessionState),
				),
			).toBe(true);
			// Property: Has exactly 5 states
			expect(Object.values(SessionState).length).toBe(5);
		});
	});
});
