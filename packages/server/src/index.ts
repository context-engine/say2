/**
 * @say2/server
 * 
 * HTTP proxy server for MCP inspection
 */

import { Hono } from "hono";
import { VERSION } from "@say2/core";

const app = new Hono();

app.get("/", (c) => {
    return c.json({
        name: "Say2",
        version: VERSION,
        status: "ok",
    });
});

app.get("/health", (c) => {
    return c.json({ status: "healthy" });
});

const port = Number(process.env.PORT) || 3000;

console.log(`Say2 server starting on port ${port}...`);

export default {
    port,
    fetch: app.fetch,
};
