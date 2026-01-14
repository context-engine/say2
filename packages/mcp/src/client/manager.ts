/**
 * McpClientManager
 *
 * Orchestrates the MCP client connection lifecycle.
 * Creates transport stack, connects client, and manages registration.
 *
 * Connection flow:
 * 1. Get session from SessionManager
 * 2. Transition to CONNECTING state
 * 3. Create StdioClientTransport with session config
 * 4. Wrap with LoggingTransport for message interception
 * 5. Create MCP SDK Client and connect
 * 6. Register in McpClientRegistry
 * 7. Discover server capabilities (tools, resources, prompts)
 *
 * Phase 1 only supports STDIO transport.
 */

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import type { MiddlewarePipeline, SessionManager } from "@say2/core";
import { LoggingTransport } from "../transport";
import type { McpClientRegistry } from "./registry";

export class McpClientManager {
	constructor(
		private registry: McpClientRegistry,
		private sessionManager: SessionManager,
		private pipeline: MiddlewarePipeline,
		private clientFactory: (
			clientInfo: { name: string; version: string },
			options?: { capabilities: any },
		) => Client = (info, opts) => new Client(info, opts),
	) {}

	/**
	 * Connect to an MCP server for the given session.
	 * Creates transport stack and initiates connection.
	 * @throws Error if session not found or transport not supported
	 */
	async connect(sessionId: string): Promise<void> {
		// 1. Get session
		const session = this.sessionManager.get(sessionId);
		if (!session) {
			throw new Error(`Session not found: ${sessionId}`);
		}

		// 2. Validate transport type (Phase 1 only supports STDIO)
		if (session.config.transport !== "stdio") {
			throw new Error(
				`Transport type '${session.config.transport}' not supported. Phase 1 only supports 'stdio'.`,
			);
		}

		// Validate STDIO config
		if (!session.config.command) {
			throw new Error("STDIO transport requires 'command' in config");
		}

		// 3. Transition to CONNECTING state
		const connectResult = this.sessionManager.connect(sessionId);
		if (!connectResult.success) {
			throw new Error(
				`Failed to transition to CONNECTING: ${connectResult.error}`,
			);
		}

		try {
			// 4. Create base STDIO transport
			const stdioTransport = new StdioClientTransport({
				command: session.config.command,
				args: session.config.args ?? [],
				env: session.config.env,
			});

			// 5. Wrap with LoggingTransport for message interception
			const loggingTransport = new LoggingTransport(
				stdioTransport,
				session,
				this.pipeline,
			);

			// 6. Create MCP SDK Client
			const client = this.clientFactory(
				{
					name: "Say2",
					version: "1.0.0",
				},
				{
					capabilities: {},
				},
			);

			// 7. Connect client (this triggers initialize handshake)
			// The StateMachineMiddleware will handle state transitions
			// as it observes the initialize/initialized messages
			await client.connect(loggingTransport);

			// 8. Register in registry
			this.registry.register(sessionId, client, loggingTransport);

			// 9. Discover capabilities (Tools, Resources, Prompts)
			// Wait for session to be active (handled by middleware but we can check state)
			await this.discoverCapabilities(sessionId);
		} catch (error) {
			// On failure, mark session as error
			const errorMessage =
				error instanceof Error ? error.message : String(error);
			this.sessionManager.markError(
				sessionId,
				`Connection failed: ${errorMessage}`,
			);
			throw error;
		}
	}

	/**
	 * Discover server capabilities by querying lists based on declared support.
	 */
	private async discoverCapabilities(sessionId: string): Promise<void> {
		const session = this.sessionManager.get(sessionId);
		if (!session || !session.serverCapabilities) {
			return;
		}

		console.log(
			`[McpClientManager] Discovering capabilities for session ${sessionId}...`,
		);

		// Discovery is "best effort" - log errors but don't fail connection
		try {
			// Tools
			if (session.serverCapabilities.tools) {
				console.log(`[McpClientManager] Discovering tools...`);
				await this.listTools(sessionId);
			}

			// Resources
			if (session.serverCapabilities.resources) {
				console.log(`[McpClientManager] Discovering resources...`);
				await this.listResources(sessionId);
			}

			// Prompts
			if (session.serverCapabilities.prompts) {
				console.log(`[McpClientManager] Discovering prompts...`);
				await this.listPrompts(sessionId);
			}
		} catch (error) {
			console.warn(`[McpClientManager] Capability discovery warning: ${error}`);
		}
	}

	/**
	 * Disconnect from an MCP server.
	 * Cleans up client and transport resources.
	 * Idempotent - no error if not connected.
	 */
	async disconnect(sessionId: string): Promise<void> {
		const entry = this.registry.get(sessionId);
		if (!entry) {
			// Not connected - idempotent, just return
			return;
		}

		try {
			// Close the client (this also closes the transport)
			await entry.client.close();
		} finally {
			// Always remove from registry
			this.registry.remove(sessionId);
		}
	}

	/**
	 * Get the MCP SDK Client for a session.
	 */
	getClient(sessionId: string): Client | undefined {
		return this.registry.get(sessionId)?.client;
	}

	/**
	 * List all tools for a session, automatically following pagination.
	 */
	async listTools(sessionId: string): Promise<{ tools: any[] }> {
		const client = this.getClient(sessionId);
		if (!client) {
			throw new Error(`Session ${sessionId} not connected`);
		}

		let tools: any[] = [];
		let cursor: string | undefined;

		do {
			const result = await client.listTools({ cursor });
			tools = tools.concat(result.tools);
			cursor = result.nextCursor;
		} while (cursor);

		return { tools };
	}

	/**
	 * List all resources for a session, automatically following pagination.
	 */
	async listResources(sessionId: string): Promise<{ resources: any[] }> {
		const client = this.getClient(sessionId);
		if (!client) {
			throw new Error(`Session ${sessionId} not connected`);
		}

		let resources: any[] = [];
		let cursor: string | undefined;

		do {
			const result = await client.listResources({ cursor });
			resources = resources.concat(result.resources);
			cursor = result.nextCursor;
		} while (cursor);

		return { resources };
	}

	/**
	 * List all resource templates for a session, automatically following pagination.
	 */
	async listResourceTemplates(
		sessionId: string,
	): Promise<{ resourceTemplates: any[] }> {
		const client = this.getClient(sessionId);
		if (!client) {
			throw new Error(`Session ${sessionId} not connected`);
		}

		let resourceTemplates: any[] = [];
		let cursor: string | undefined;

		do {
			const result = await client.listResourceTemplates({ cursor });
			resourceTemplates = resourceTemplates.concat(result.resourceTemplates);
			cursor = result.nextCursor;
		} while (cursor);

		return { resourceTemplates };
	}

	/**
	 * List all prompts for a session, automatically following pagination.
	 */
	async listPrompts(sessionId: string): Promise<{ prompts: any[] }> {
		const client = this.getClient(sessionId);
		if (!client) {
			throw new Error(`Session ${sessionId} not connected`);
		}

		let prompts: any[] = [];
		let cursor: string | undefined;

		do {
			const result = await client.listPrompts({ cursor });
			prompts = prompts.concat(result.prompts);
			cursor = result.nextCursor;
		} while (cursor);

		return { prompts };
	}

	/**
	 * Check if a session has an active MCP connection.
	 */
	isConnected(sessionId: string): boolean {
		return this.registry.get(sessionId) !== undefined;
	}
}
