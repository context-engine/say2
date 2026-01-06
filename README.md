# Say2

**Multi-protocol inspector for AI agent communication.**

Observe and debug traffic across MCP, ACP, and A2A protocols from a unified dashboard.

## Why Say2?

AI agents communicate using different protocols, each with their own tools and formats. Say2 provides a single pane of glass to inspect them all.

| Protocol | What It Is | Use Case |
|----------|-----------|----------|
| [**MCP**](https://modelcontextprotocol.io/) | Model Context Protocol | AI ↔ Tools (Anthropic) |
| [**ACP**](https://agentclientprotocol.com/) | Agent Client Protocol | IDE ↔ Coding Agents (Zed) |
| [**A2A**](https://google.github.io/A2A/) | Agent-to-Agent | Multi-agent workflows (Google) |

## Roadmap

| Version | Focus | Status |
|---------|-------|--------|
| **v1** | Multi-protocol Inspection | 🚧 In Progress |
| **v2** | Gateway (routing, rate limiting) | 📋 Planned |
| **v3** | Protocol Translation (MCP ↔ ACP) | 📋 Planned |

## v1 Features

- [ ] **MCP Inspection** - Observe tool calls, resources, prompts
- [ ] **ACP Inspection** - Debug IDE ↔ agent sessions, view agent thoughts
- [ ] **A2A Inspection** - Monitor agent-to-agent task flows
- [ ] **Unified Dashboard** - Single UI for all protocols
- [ ] **Two Operating Modes**
  - Built-in client (manual testing)
  - Transparent proxy (inspect real traffic)
- [ ] **Export Traces** - Save inspection logs for sharing

## Tech Stack

| Technology | Choice | Reason |
|------------|--------|--------|
| **Runtime** | Bun | Fast startup, native TypeScript, modern APIs |
| **Language** | TypeScript | Type safety, SDK compatibility |
| **Web Framework** | Hono | Lightweight, Bun-optimized |
| **MCP SDK** | @modelcontextprotocol/sdk | Official MCP client/server support |

## Project Structure

```
say2/
├── packages/
│   ├── core/           # Shared proxy & transport logic
│   ├── server/         # HTTP proxy server
│   └── web/            # React inspection UI
├── package.json        # Workspace root
└── README.md
```

## Getting Started

### Prerequisites

- [Bun](https://bun.sh) v1.0+

### Installation

```bash
# Clone
git clone git@github.com:context-engine/say2.git
cd say2

# Install dependencies
bun install

# Start development
bun run dev
```

### Usage

```bash
# Mode 1: Built-in client (test an MCP server)
say2 inspect mcp --command "node my-server.js"

# Mode 2: Transparent proxy (inspect real traffic)
say2 proxy --port 8080 --target http://mcp-server:3000
```

## Architecture

```
┌──────────────┐     ┌─────────────────────────────────────┐     ┌──────────────┐
│   Client     │────►│              Say2                   │────►│   Server     │
│ (Claude, IDE)│     │  ┌─────────┐  ┌────────────────┐    │     │ (MCP, ACP,   │
│              │◄────│  │ Inspect │  │ Web Dashboard  │    │◄────│  A2A Agent)  │
└──────────────┘     │  └─────────┘  └────────────────┘    │     └──────────────┘
                     └─────────────────────────────────────┘
```

## License

Apache 2.0
