/**
 * @say2/mcp
 *
 * MCP-specific client logic for Say2.
 * Wraps the @modelcontextprotocol/sdk and integrates with Say2's core infrastructure.
 */

// Client management
export * from "./client";
// Protocol event detection
export * from "./events";
// Transport decorators
export * from "./transport";
// Operation stores (Tool Execution)
export * from "./store";
// Tool operations extensions (Progress, Cancel, Content)
export * from "./progress/tracker";
export * from "./cancel/manager";
export * from "./content/parser";

// MCP-specific types
export * from "./types";

