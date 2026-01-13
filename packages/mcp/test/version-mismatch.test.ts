/**
 * Version Mismatch Tests (Unit Level)
 *
 * Tests for protocol version negotiation and detection.
 * Tests the mock server version handling directly.
 */

import { describe, expect, test } from "bun:test";
import { handleMessage } from "./fixtures/mock-server";

describe("Protocol Version Unit Tests", () => {
	test("returns standard protocol version (2024-11-05) by default", () => {
		const config = {
			name: "standard-server",
			version: "1.0.0",
			// No protocolVersion specified - should use default
			capabilities: { tools: true },
		};

		const response = handleMessage(
			{
				jsonrpc: "2.0" as const,
				id: 1,
				method: "initialize",
				params: {
					protocolVersion: "2024-11-05",
					capabilities: {},
					clientInfo: { name: "Test", version: "1.0.0" },
				},
			},
			config,
		) as any;

		expect(response).not.toBeNull() as any;
		expect(response.result.protocolVersion).toBe("2024-11-05") as any;
		expect(response.result.serverInfo.name).toBe("standard-server") as any;
	}) as any;

	test("returns custom protocol version when configured", () => {
		const config = {
			name: "future-server",
			version: "2.0.0",
			protocolVersion: "2025-01-15", // Future version
			capabilities: { tools: true },
		};

		const response = handleMessage(
			{
				jsonrpc: "2.0" as const,
				id: 1,
				method: "initialize",
				params: {
					protocolVersion: "2024-11-05",
					capabilities: {},
					clientInfo: { name: "Test", version: "1.0.0" },
				},
			},
			config,
		) as any;

		expect(response).not.toBeNull() as any;
		expect(response.result.protocolVersion).toBe("2025-01-15") as any;
	}) as any;

	test("returns incompatible version when configured", () => {
		const config = {
			name: "legacy-server",
			version: "0.5.0",
			protocolVersion: "1.0.0", // Old incompatible version
			capabilities: { tools: true },
		};

		const response = handleMessage(
			{
				jsonrpc: "2.0" as const,
				id: 1,
				method: "initialize",
				params: {
					protocolVersion: "2024-11-05",
					capabilities: {},
					clientInfo: { name: "Test", version: "1.0.0" },
				},
			},
			config,
		) as any;

		expect(response).not.toBeNull() as any;
		expect(response.result.protocolVersion).toBe("1.0.0") as any;

		// Verify version is incompatible with 2024- format
		const isCompatible = response.result.protocolVersion.startsWith(
			"2024-",
		) as any;
		expect(isCompatible).toBe(false) as any;
	}) as any;

	test("includes protocol version in initialize response", () => {
		const config = {
			name: "versioned-server",
			version: "1.5.0",
			protocolVersion: "2024-11-05",
			capabilities: { tools: true, resources: true },
		};

		const response = handleMessage(
			{
				jsonrpc: "2.0" as const,
				id: 1,
				method: "initialize",
				params: {
					protocolVersion: "2024-11-05",
					capabilities: {},
					clientInfo: { name: "Test", version: "1.0.0" },
				},
			},
			config,
		) as any;

		expect(response).not.toBeNull() as any;
		expect(response.result).toHaveProperty("protocolVersion") as any;
		expect(response.result).toHaveProperty("capabilities") as any;
		expect(response.result).toHaveProperty("serverInfo") as any;
		expect(response.result.protocolVersion).toBe("2024-11-05") as any;
	}) as any;

	test("different servers can have different protocol versions", () => {
		const server1Config = {
			name: "server-1",
			version: "1.0.0",
			protocolVersion: "2024-11-05",
			capabilities: { tools: true },
		};

		const server2Config = {
			name: "server-2",
			version: "2.0.0",
			protocolVersion: "2025-01-15",
			capabilities: { tools: true },
		};

		const response1 = handleMessage(
			{
				jsonrpc: "2.0" as const,
				id: 1,
				method: "initialize",
				params: {
					protocolVersion: "2024-11-05",
					capabilities: {},
					clientInfo: { name: "Test", version: "1.0.0" },
				},
			},
			server1Config,
		) as any;

		const response2 = handleMessage(
			{
				jsonrpc: "2.0" as const,
				id: 1,
				method: "initialize",
				params: {
					protocolVersion: "2024-11-05",
					capabilities: {},
					clientInfo: { name: "Test", version: "1.0.0" },
				},
			},
			server2Config,
		) as any;

		expect(response1?.result.protocolVersion).toBe("2024-11-05") as any;
		expect(response2?.result.protocolVersion).toBe("2025-01-15") as any;
		expect(response1?.result.serverInfo.name).toBe("server-1") as any;
		expect(response2?.result.serverInfo.name).toBe("server-2") as any;
	}) as any;
}) as any;
