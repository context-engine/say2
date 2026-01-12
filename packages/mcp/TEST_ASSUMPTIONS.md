# Phase 1 Test Assumptions

> **Created**: 2026-01-12  
> **Purpose**: Document assumptions made during TDD-style test development  
> **Status**: Tests written, awaiting implementation

## Test Status

| Type | Count | Status |
|------|-------|--------|
| Unit Tests | 77 | ⏳ Pending (TDD - stubs not implemented) |
| Passing Tests | 186 | ✅ All Phase 0 + compatible tests |
| Total | 263 | - |

---

## Overview

These tests are written **before implementation** (TDD-style). They define the expected API contracts based on the Phase 1 specification documents.

---

## Source Documents

| Document | Purpose |
|----------|---------|
| `v0-docs/say2/3-how/specs/05-phases/02-phase-1-builtin-client-core/01-overview.md` | Test scenarios |
| `v0-docs/say2/3-how/specs/05-phases/02-phase-1-builtin-client-core/02-mcp-package.md` | API definitions |
| `v0-docs/say2/3-how/specs/05-phases/02-phase-1-builtin-client-core/03-state-machine.md` | State machine behavior |
| `v0-docs/say2/3-how/specs/05-phases/02-phase-1-builtin-client-core/04-implementation-plan.md` | Implementation order |

---

## MCP SDK Assumptions

The `@modelcontextprotocol/sdk` package provides these interfaces (assumed from docs + spec examples):

### Transport Interface

```typescript
interface Transport {
  // Start the transport (optional - some transports auto-start)
  start?(): Promise<void>;
  
  // Send a JSON-RPC message
  send?(message: JSONRPCMessage): Promise<void>;
  
  // Close the transport
  close?(): Promise<void>;
  
  // Callback properties (set by client/server)
  onmessage?: (message: JSONRPCMessage) => void;
  onclose?: () => void;
  onerror?: (error: Error) => void;
}
```

**Note**: The actual MCP SDK uses callback properties (`onmessage`, `onclose`, `onerror`) rather than methods (`onMessage()`, `onClose()`, `onError()`). The spec's implementation sketch shows method-style for clarity, but the actual implementation should match the SDK's callback property pattern.

### Client Class

```typescript
class Client {
  constructor(clientInfo: { name: string; version: string }, options?: { capabilities?: object });
  connect(transport: Transport): Promise<void>;
  close(): Promise<void>;
  listTools(options?: { cursor?: string }): Promise<{ tools: Tool[]; nextCursor?: string }>;
  listResources(options?: { cursor?: string }): Promise<{ resources: Resource[]; nextCursor?: string }>;
  listPrompts(options?: { cursor?: string }): Promise<{ prompts: Prompt[]; nextCursor?: string }>;
  callTool(request: { name: string; arguments: object }): Promise<ToolResult>;
  getServerCapabilities(): ServerCapabilities | undefined;
  getServerVersion(): Implementation | undefined;
}
```

### StdioClientTransport

```typescript
class StdioClientTransport implements Transport {
  constructor(options: {
    command: string;
    args?: string[];
    env?: Record<string, string>;
    cwd?: string;
  });
}
```

---

## API Contract Assumptions

### McpClientRegistry

Based on spec lines 90-96 of `02-mcp-package.md`:

```typescript
interface McpClientEntry {
  sessionId: string;
  client: Client;           // MCP SDK Client instance
  transport: LoggingTransport;
  connectedAt: Date;
}

class McpClientRegistry {
  register(sessionId: string, client: Client, transport: LoggingTransport): void;
  get(sessionId: string): McpClientEntry | undefined;
  remove(sessionId: string): boolean;
  list(): McpClientEntry[];
}
```

**Assumptions**:
- `register()` returns void (throws on duplicate sessionId)
- `get()` returns undefined if not found
- `remove()` returns boolean indicating if entry existed
- `list()` returns all entries (not filtered)

### LoggingTransport

Based on spec lines 344-408 of `02-mcp-package.md`:

```typescript
class LoggingTransport implements Transport {
  constructor(
    wrapped: Transport,
    session: Session,
    pipeline: MiddlewarePipeline
  );
  
  // Intercepts and logs before forwarding
  send(message: JSONRPCMessage): Promise<void>;
  close(): Promise<void>;
  
  // Callback properties matching Transport interface
  onmessage?: (message: JSONRPCMessage) => void;
  onclose?: () => void;
  onerror?: (error: Error) => void;
}
```

**Assumptions**:
- Outbound messages: `send()` creates MessageEvent, runs pipeline, then forwards to wrapped transport
- Inbound messages: Intercepted via wrapped transport's `onmessage`, creates MessageEvent, runs pipeline, then calls own `onmessage`
- Messages are forwarded **unchanged** (byte-for-byte preservation)
- Pipeline is run **before** forwarding (both directions)

### EventDetector

Based on spec lines 618-656 of `02-mcp-package.md`:

```typescript
class EventDetector {
  // Request detection
  static isInitializeRequest(msg: JsonRpcMessage): boolean;
  
  // Response detection
  static isInitializeResponse(msg: JsonRpcMessage): boolean;
  static isToolsListResponse(msg: JsonRpcMessage): boolean;
  
  // Notification detection
  static isInitializedNotification(msg: JsonRpcMessage): boolean;
  
  // Extraction
  static extractCapabilities(msg: JsonRpcMessage): Record<string, unknown> | undefined;
  static extractServerInfo(msg: JsonRpcMessage): { name: string; version: string } | undefined;
}
```

**Assumptions**:
- Detection methods return `false` for any invalid/malformed messages (no throws)
- `isInitializeRequest`: Checks `method === 'initialize'`
- `isInitializeResponse`: Checks for `result.protocolVersion` presence
- `isInitializedNotification`: Checks `method === 'notifications/initialized'`
- Extraction methods return `undefined` if data not present

### McpClientManager

Based on spec lines 464-572 and 681-723 of `02-mcp-package.md`:

```typescript
class McpClientManager {
  constructor(
    registry: McpClientRegistry,
    sessionManager: SessionManager,
    pipeline: MiddlewarePipeline
  );
  
  connect(sessionId: string): Promise<void>;
  disconnect(sessionId: string): Promise<void>;
  getClient(sessionId: string): Client | undefined;
  isConnected(sessionId: string): boolean;
}
```

**Assumptions**:
- `connect()` throws if session not found
- `connect()` throws if session.config.transport is not 'stdio' (Phase 1 only)
- `connect()` calls `sessionManager.connect()` to transition state
- `connect()` creates transport stack: StdioClientTransport → LoggingTransport
- `connect()` calls `client.connect()` which handles initialize handshake
- On failure, calls `sessionManager.markError()`
- `disconnect()` is idempotent (no error if not connected)

### StateMachineMiddleware

Based on spec lines 281-324 of `03-state-machine.md`:

```typescript
function createStateMachineMiddleware(sessionManager: SessionManager): Middleware;
```

**Behavior Assumptions**:
- Detects `initialize` request (outbound) → calls `sessionManager.initialize()`
- Detects `initialize` response (inbound) → extracts capabilities, stores in context
- Detects `initialized` notification (outbound) → calls `sessionManager.activate()`
- Does NOT handle `connect` transition (that's done by McpClientManager)
- Logs warning on transition failure but does NOT throw
- Always calls `next()` after processing

### StoreMiddleware

Based on spec lines 726-739 of `02-mcp-package.md`:

```typescript
function createStoreMiddleware(store: MessageStore): Middleware;
```

**Behavior Assumptions**:
- Calls `store.store(ctx.event)` before calling `next()`
- Always calls `next()` (does not stop the chain)

---

## Protocol Message Assumptions

### Initialize Request

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "initialize",
  "params": {
    "protocolVersion": "2024-11-05",
    "capabilities": {},
    "clientInfo": { "name": "say2", "version": "1.0.0" }
  }
}
```

### Initialize Response

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "protocolVersion": "2024-11-05",
    "capabilities": { "tools": {} },
    "serverInfo": { "name": "test-server", "version": "1.0.0" }
  }
}
```

### Initialized Notification

```json
{
  "jsonrpc": "2.0",
  "method": "notifications/initialized"
}
```

---

## Test Strategy

### Unit Tests (Mocked Dependencies)

Each component is tested in isolation:

| Component | Mocks |
|-----------|-------|
| McpClientRegistry | None (pure data structure) |
| EventDetector | None (pure functions) |
| LoggingTransport | Transport, MiddlewarePipeline |
| StateMachineMiddleware | SessionManager |
| StoreMiddleware | MessageStore |
| McpClientManager | All dependencies |

### E2E Tests (Real Mock Server)

Full integration using a spawnable mock MCP server:

```
HTTP API → SessionManager → McpClientManager → LoggingTransport → MockServer
```

---

## Deviations from Spec

During implementation, if any of these assumptions prove incorrect, **update this document** and the corresponding tests.

---

*Last Updated: 2026-01-12*
