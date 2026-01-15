/**
 * @say2/mcp
 *
 * MCP-specific client logic for Say2.
 * Wraps the @modelcontextprotocol/sdk and integrates with Say2's core infrastructure.
 */

export * from "./cancel/manager";
// Client management
export * from "./client";
export * from "./content/parser";
// Protocol event detection
export * from "./events";
// Tool operations extensions (Progress, Cancel, Content)
export * from "./progress/tracker";
// Operation stores (Tool Execution)
export * from "./store";
// Transport decorators
export * from "./transport";

// MCP-specific types
export * from "./types";
