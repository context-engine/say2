/**
 * @say2/server
 *
 * HTTP server for Say2 MCP inspection
 */

import { messageStore, sessionManager } from "@say2/core";
import { Hono } from "hono";

const app = new Hono();

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

const port = Number(process.env.PORT) || 3000;

console.log(`Say2 server starting on port ${port}...`);

export { app };

export default {
	port,
	fetch: app.fetch,
};
