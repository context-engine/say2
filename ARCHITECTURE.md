# Say2 Architecture Design

## Design Principles

1. **Protocol-agnostic core** - Same proxy/session logic works for MCP, ACP, A2A
2. **Plugin-based protocols** - Each protocol is a plugin, easy to add new ones
3. **Two modes from day one** - Built-in client + transparent proxy
4. **Focused scope** - Start with MCP, but architecture supports all

---

## Package Structure

```
say2/
├── packages/
│   ├── proxy/              # Core proxy engine (protocol-agnostic)
│   │   ├── src/
│   │   │   ├── session.ts      # Session management
│   │   │   ├── transport.ts    # Transport abstraction
│   │   │   ├── message.ts      # Message logging/storage
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   ├── protocols/          # Protocol-specific implementations
│   │   ├── mcp/            # MCP protocol plugin
│   │   │   ├── src/
│   │   │   │   ├── transports/
│   │   │   │   │   ├── stdio.ts
│   │   │   │   │   ├── sse.ts
│   │   │   │   │   └── http.ts
│   │   │   │   ├── types.ts    # MCP message types
│   │   │   │   ├── parser.ts   # MCP-specific parsing
│   │   │   │   └── index.ts
│   │   │   └── package.json
│   │   ├── acp/            # ACP protocol plugin (future)
│   │   └── a2a/            # A2A protocol plugin (future)
│   │
│   ├── server/             # HTTP API server
│   │   ├── src/
│   │   │   ├── routes/
│   │   │   │   ├── sessions.ts
│   │   │   │   ├── messages.ts
│   │   │   │   └── health.ts
│   │   │   ├── websocket.ts    # Real-time streaming
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   ├── cli/                # Command-line interface
│   │   └── package.json
│   │
│   └── web/                # React UI (later)
│       └── package.json
│
├── package.json            # Workspace root
└── README.md
```

---

## Core Abstractions

### 1. Transport Interface (protocol-agnostic)

```typescript
// packages/proxy/src/transport.ts

interface Transport {
  send(message: unknown): Promise<void>;
  onMessage(handler: (message: unknown) => void): void;
  onError(handler: (error: Error) => void): void;
  close(): Promise<void>;
}

interface TransportFactory {
  create(config: TransportConfig): Promise<Transport>;
}
```

### 2. Protocol Plugin Interface

```typescript
// packages/proxy/src/protocol.ts

interface ProtocolPlugin {
  name: string;  // "mcp" | "acp" | "a2a"
  
  // Transport factories for this protocol
  transports: {
    [key: string]: TransportFactory;  // "stdio", "sse", "http"
  };
  
  // Message parsing
  parseMessage(raw: unknown): ParsedMessage;
  
  // Optional: protocol-specific UI components
  uiComponents?: Record<string, React.Component>;
}
```

### 3. Session (protocol-agnostic)

```typescript
// packages/proxy/src/session.ts

interface Session {
  id: string;
  protocol: string;           // "mcp" | "acp" | "a2a"
  mode: "client" | "proxy";   // Built-in client or transparent proxy
  
  clientTransport: Transport;
  serverTransport: Transport;
  
  messages: Message[];
  createdAt: Date;
  status: "active" | "closed";
}
```

---

## Two Operating Modes

### Mode 1: Built-in Client
Say2 acts as the MCP client, user manually triggers requests.

```
┌─────────────┐     ┌─────────────────────┐     ┌─────────────┐
│   Say2 UI   │────►│   Say2 Proxy        │────►│ MCP Server  │
│  (Browser)  │◄────│   (client mode)     │◄────│             │
└─────────────┘     └─────────────────────┘     └─────────────┘
```

### Mode 2: Transparent Proxy
Say2 sits between external client and server, inspects real traffic.

```
┌─────────────┐     ┌─────────────────────┐     ┌─────────────┐
│   Claude    │────►│   Say2 Proxy        │────►│ MCP Server  │
│   (Client)  │◄────│   (proxy mode)      │◄────│             │
└─────────────┘     └─────────────────────┘     └─────────────┘
                              │
                              ▼
                    ┌─────────────────────┐
                    │   Say2 UI (observe) │
                    └─────────────────────┘
```

---

## Data Flow

```
                                ┌─────────────────────────────────────┐
                                │           Say2 Server               │
                                │                                     │
┌──────────────┐  Transport     │  ┌───────────┐    ┌─────────────┐  │  Transport    ┌────────────┐
│   Client     │◄──────────────►│  │  Session  │───►│  Protocol   │  │◄─────────────►│   Server   │
│              │                │  │  Manager  │    │  Plugin     │  │               │            │
└──────────────┘                │  └───────────┘    │  (MCP/ACP)  │  │               └────────────┘
                                │        │          └─────────────┘  │
                                │        ▼                           │
                                │  ┌───────────┐                     │
                                │  │  Message  │                     │
                                │  │  Store    │                     │
                                │  └───────────┘                     │
                                │        │                           │
                                │        ▼ WebSocket                 │
                                │  ┌───────────┐                     │
                                │  │  Web UI   │                     │
                                │  └───────────┘                     │
                                └─────────────────────────────────────┘
```

---

## v1 Scope (MCP Only)

For v1, we implement:

| Package | Status |
|---------|--------|
| `@say2/proxy` | ✅ Core session/transport logic |
| `@say2/protocol-mcp` | ✅ MCP transports (STDIO, SSE, HTTP) |
| `@say2/server` | ✅ HTTP API + WebSocket |
| `@say2/cli` | ✅ Basic CLI |
| `@say2/protocol-acp` | ❌ v2 |
| `@say2/protocol-a2a` | ❌ v2 |
| `@say2/web` | ⏳ Later in v1 |

---

## Why This Structure?

| Benefit | How |
|---------|-----|
| **Add new protocol** | Create new `packages/protocols/xxx/` folder |
| **Protocol isolation** | Each protocol has its own types, transports |
| **Shared logic** | Session management, message storage in `@say2/proxy` |
| **Testable** | Each package can be tested independently |
| **Flexible deployment** | CLI can work without server, server without UI |

---

## Next Steps

1. Update package structure to match this design
2. Implement `@say2/proxy` with session/transport abstractions
3. Implement `@say2/protocol-mcp` with STDIO transport
4. Build server routes for session management
