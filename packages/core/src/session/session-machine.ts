/**
 * Session State Machine
 *
 * XState v5 machine definition for session lifecycle management.
 * Enforces valid state transitions and provides type-safe events.
 */

import { assign, setup } from "xstate";
import type { ServerConfig } from "../types";

// =============================================================================
// Types
// =============================================================================

export interface SessionContext {
    id: string;
    config: ServerConfig;
    protocol: "mcp" | "acp" | "a2a";
    protocolVersion?: string;
    clientCapabilities?: Record<string, unknown>;
    serverCapabilities?: Record<string, unknown>;
    createdAt: Date;
    updatedAt: Date;
    errorReason?: string;
}

export type SessionEvent =
    | { type: "INITIALIZE" }
    | {
        type: "ACTIVATE";
        clientCapabilities?: Record<string, unknown>;
        serverCapabilities?: Record<string, unknown>;
        protocolVersion?: string;
    }
    | { type: "CLOSE" }
    | { type: "ERROR"; reason?: string }
    | {
        type: "UPDATE_CAPABILITIES";
        clientCapabilities?: Record<string, unknown>;
        serverCapabilities?: Record<string, unknown>;
    };

export interface SessionInput {
    id: string;
    config: ServerConfig;
    protocol?: "mcp" | "acp" | "a2a";
}

// =============================================================================
// Machine Definition
// =============================================================================

export const sessionMachine = setup({
    types: {
        context: {} as SessionContext,
        events: {} as SessionEvent,
        input: {} as SessionInput,
    },
    actions: {
        updateTimestamp: assign({
            updatedAt: () => new Date(),
        }),
        setCapabilities: assign({
            clientCapabilities: ({ context, event }) => {
                if (event.type === "ACTIVATE" || event.type === "UPDATE_CAPABILITIES") {
                    return event.clientCapabilities ?? context.clientCapabilities;
                }
                return context.clientCapabilities;
            },
            serverCapabilities: ({ context, event }) => {
                if (event.type === "ACTIVATE" || event.type === "UPDATE_CAPABILITIES") {
                    return event.serverCapabilities ?? context.serverCapabilities;
                }
                return context.serverCapabilities;
            },
            protocolVersion: ({ context, event }) => {
                if (event.type === "ACTIVATE" && event.protocolVersion) {
                    return event.protocolVersion;
                }
                return context.protocolVersion;
            },
            updatedAt: () => new Date(),
        }),
        setError: assign({
            errorReason: ({ event }) => {
                if (event.type === "ERROR") {
                    return event.reason;
                }
                return undefined;
            },
            updatedAt: () => new Date(),
        }),
    },
}).createMachine({
    id: "session",
    initial: "created",
    context: ({ input }) => ({
        id: input.id,
        config: input.config,
        protocol: input.protocol ?? "mcp",
        createdAt: new Date(),
        updatedAt: new Date(),
    }),
    states: {
        created: {
            on: {
                INITIALIZE: {
                    target: "initializing",
                    actions: "updateTimestamp",
                },
                ERROR: {
                    target: "error",
                    actions: "setError",
                },
            },
        },
        initializing: {
            on: {
                ACTIVATE: {
                    target: "active",
                    actions: "setCapabilities",
                },
                ERROR: {
                    target: "error",
                    actions: "setError",
                },
            },
        },
        active: {
            on: {
                UPDATE_CAPABILITIES: {
                    actions: "setCapabilities",
                },
                CLOSE: {
                    target: "closed",
                    actions: "updateTimestamp",
                },
                ERROR: {
                    target: "error",
                    actions: "setError",
                },
            },
        },
        closed: {
            type: "final",
        },
        error: {
            type: "final",
        },
    },
});

// =============================================================================
// State Mapping
// =============================================================================

/**
 * Maps XState state values to SessionState enum values.
 * This maintains backward compatibility with existing code.
 */
export const STATE_VALUE_MAP = {
    created: "CREATED",
    initializing: "INITIALIZING",
    active: "ACTIVE",
    closed: "CLOSED",
    error: "ERROR",
} as const;

export type MachineStateValue = keyof typeof STATE_VALUE_MAP;
