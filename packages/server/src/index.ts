/**
 * @say2/server
 *
 * HTTP server for Say2 MCP inspection
 */

import {
	createPipeline,
	messageStore,
	ServerConfigSchema,
	sessionManager,
} from "@say2/core";
import { McpClientManager, McpClientRegistry } from "@say2/mcp";
import { Hono } from "hono";

const app = new Hono();

// Instantiate Services
const registry = new McpClientRegistry();
const pipeline = createPipeline();
const mcpClientManager = new McpClientManager(
	registry,
	sessionManager,
	pipeline,
);

// Health check
app.get("/health", (c) => {
	return c.json({ status: "healthy" });
});

// Server info
app.get("/", (c) => {
	return c.json({
		name: "Say2",
		version: "0.1.0",
		status: "ok",
	});
});

// Session endpoints
app.get("/sessions", (c) => {
	const sessions = sessionManager.list();
	return c.json({
		sessions: sessions.map((s) => ({
			id: s.id,
			state: s.state,
			createdAt: s.createdAt.toISOString(),
			config: s.config,
		})),
	});
});

app.post("/sessions", async (c) => {
	try {
		const body = await c.req.json();
		const config = ServerConfigSchema.parse(body);

		const session = sessionManager.create(config);

		// Trigger connection (async)
		// We don't await the full connection here to return quickly,
		// or we could await it to report immediate errors.
		// For an API, it's often better to start the process and let the client
		// poll for state changes, but for simplicity/testing we can await.
		// Let's await it to catch config errors early.
		await mcpClientManager.connect(session.id);

		return c.json(
			{
				id: session.id,
				state: session.state,
				createdAt: session.createdAt.toISOString(),
				config: session.config,
			},
			201,
		);
	} catch (error) {
		console.error("Failed to create session:", error);
		if (error && typeof error === "object" && "issues" in error) {
			// Zod error
			return c.json({ error: "Invalid configuration", details: error }, 400);
		}
		const errorMessage = error instanceof Error ? error.message : String(error);
		if (errorMessage.includes("requires 'command'")) {
			return c.json({ error: errorMessage }, 400);
		}
		return c.json(
			{ error: errorMessage },
			500,
		);
	}
});

app.get("/sessions/:id", (c) => {
	const id = c.req.param("id");
	const session = sessionManager.get(id);

	if (!session) {
		return c.json({ error: "Session not found" }, 404);
	}

	const messages = messageStore.getBySession(id);

	return c.json({
		id: session.id,
		state: session.state,
		createdAt: session.createdAt.toISOString(),
		updatedAt: session.updatedAt.toISOString(),
		config: session.config,
		capabilities: {
			client: session.clientCapabilities,
			server: session.serverCapabilities,
		},
		messageCount: messages.length,
	});
});

app.delete("/sessions/:id", async (c) => {
	const id = c.req.param("id");
	const session = sessionManager.get(id);

	if (!session) {
		return c.json({ error: "Session not found" }, 404);
	}

	try {
		await mcpClientManager.disconnect(id);
		sessionManager.close(id);
		sessionManager.delete(id); // Enforce removal to satisfy tests expecting cleanup
		// Current SessionManager has 'close' but no 'delete/remove' method explicitly shown in prev views.
		// Let's check if 'remove' exists on SessionManager. If not, 'close' is safest.
		// Assuming we just want to close the connection.
		return c.body(null, 204);
	} catch (error) {
		return c.json(
			{ error: error instanceof Error ? error.message : String(error) },
			500,
		);
	}
});

const port = Number(process.env.PORT) || 3000;

console.log(`Say2 server starting on port ${port}...`);

export { app };

export default {
	port,
	fetch: app.fetch,
};
