/**
 * Session Manager
 *
 * Manages MCP session lifecycle using XState actors.
 * Enforces valid state transitions through the session state machine.
 */

import { type ActorRefFrom, createActor } from "xstate";
import { type ServerConfig, type Session, SessionState } from "../types";
import {
	type MachineStateValue,
	type SessionContext,
	STATE_VALUE_MAP,
	sessionMachine,
} from "./session-machine";

type SessionActor = ActorRefFrom<typeof sessionMachine>;

/**
 * Result of a state transition attempt.
 */
export interface TransitionResult {
	success: boolean;
	error?: string;
}

export class SessionManager {
	private actors: Map<string, SessionActor> = new Map();

	/**
	 * Create a new session with the given server configuration.
	 */
	create(config: ServerConfig): Session {
		const id = crypto.randomUUID();

		const actor = createActor(sessionMachine, {
			input: { id, config },
		});
		actor.start();

		this.actors.set(id, actor);
		return this.snapshotToSession(actor);
	}

	/**
	 * Get a session by ID.
	 */
	get(id: string): Session | undefined {
		const actor = this.actors.get(id);
		if (!actor) return undefined;
		return this.snapshotToSession(actor);
	}

	/**
	 * List all active sessions (not CLOSED or ERROR).
	 */
	list(): Session[] {
		return Array.from(this.actors.values())
			.map((actor) => this.snapshotToSession(actor))
			.filter(
				(session) =>
					session.state !== SessionState.CLOSED &&
					session.state !== SessionState.ERROR,
			);
	}

	/**
	 * List all sessions including closed ones.
	 */
	listAll(): Session[] {
		return Array.from(this.actors.values()).map((actor) =>
			this.snapshotToSession(actor),
		);
	}

	/**
	 * Initialize a session (CREATED → INITIALIZING).
	 */
	initialize(id: string): TransitionResult {
		return this.sendEvent(id, { type: "INITIALIZE" });
	}

	/**
	 * Activate a session with capabilities (INITIALIZING → ACTIVE).
	 */
	activate(
		id: string,
		clientCapabilities?: Record<string, unknown>,
		serverCapabilities?: Record<string, unknown>,
		protocolVersion?: string,
	): TransitionResult {
		return this.sendEvent(id, {
			type: "ACTIVATE",
			clientCapabilities,
			serverCapabilities,
			protocolVersion,
		});
	}

	/**
	 * Close a session (ACTIVE → CLOSED).
	 */
	close(id: string): TransitionResult {
		return this.sendEvent(id, { type: "CLOSE" });
	}

	/**
	 * Mark a session as error (any state → ERROR).
	 */
	markError(id: string, reason?: string): TransitionResult {
		return this.sendEvent(id, { type: "ERROR", reason });
	}

	/**
	 * Update session state.
	 * @deprecated Use specific transition methods (initialize, activate, close, markError) instead.
	 * This method is kept for backward compatibility but validates transitions.
	 */
	updateState(id: string, state: SessionState): TransitionResult {
		// Map SessionState to events
		const eventMap: Record<string, { type: string; reason?: string }> = {
			[SessionState.INITIALIZING]: { type: "INITIALIZE" },
			[SessionState.ACTIVE]: { type: "ACTIVATE" },
			[SessionState.CLOSED]: { type: "CLOSE" },
			[SessionState.ERROR]: { type: "ERROR" },
		};

		const event = eventMap[state];
		if (!event) {
			return { success: false, error: `Cannot transition to state: ${state}` };
		}

		return this.sendEvent(id, event as Parameters<SessionActor["send"]>[0]);
	}

	/**
	 * Update session capabilities (only valid in ACTIVE state).
	 */
	updateCapabilities(
		id: string,
		clientCapabilities?: Record<string, unknown>,
		serverCapabilities?: Record<string, unknown>,
	): TransitionResult {
		const actor = this.actors.get(id);
		if (!actor) {
			return { success: false, error: "Session not found" };
		}

		// Only allow capability updates in active state
		const currentState = actor.getSnapshot().value as MachineStateValue;
		if (currentState !== "active") {
			return {
				success: false,
				error: `Cannot update capabilities in state: ${STATE_VALUE_MAP[currentState]}`,
			};
		}

		return this.sendEvent(id, {
			type: "UPDATE_CAPABILITIES",
			clientCapabilities,
			serverCapabilities,
		});
	}

	/**
	 * Delete a session (remove from memory and stop actor).
	 */
	delete(id: string): boolean {
		const actor = this.actors.get(id);
		if (!actor) return false;

		actor.stop();
		return this.actors.delete(id);
	}

	/**
	 * Get count of sessions.
	 */
	count(): number {
		return this.actors.size;
	}

	/**
	 * Send an event to a session actor.
	 */
	private sendEvent(
		id: string,
		event: Parameters<SessionActor["send"]>[0],
	): TransitionResult {
		const actor = this.actors.get(id);
		if (!actor) {
			return { success: false, error: "Session not found" };
		}

		const beforeState = actor.getSnapshot().value as MachineStateValue;

		// Check if the actor is in a final state
		if (actor.getSnapshot().status === "done") {
			return {
				success: false,
				error: `Session is in terminal state: ${STATE_VALUE_MAP[beforeState]}`,
			};
		}

		actor.send(event);

		const afterState = actor.getSnapshot().value as MachineStateValue;

		// If state didn't change and it wasn't an UPDATE_CAPABILITIES event, the transition was invalid
		if (beforeState === afterState && event.type !== "UPDATE_CAPABILITIES") {
			return {
				success: false,
				error: `Invalid transition: ${STATE_VALUE_MAP[beforeState]} + ${event.type}`,
			};
		}

		return { success: true };
	}

	/**
	 * Convert actor snapshot to Session interface for backward compatibility.
	 */
	private snapshotToSession(actor: SessionActor): Session {
		const snapshot = actor.getSnapshot();
		const context = snapshot.context as SessionContext;
		const stateValue = snapshot.value as MachineStateValue;

		return {
			id: context.id,
			state: STATE_VALUE_MAP[stateValue],
			createdAt: context.createdAt,
			updatedAt: context.updatedAt,
			config: context.config,
			protocol: context.protocol,
			protocolVersion: context.protocolVersion,
			clientCapabilities: context.clientCapabilities,
			serverCapabilities: context.serverCapabilities,
		};
	}
}

// Export singleton instance for convenience
export const sessionManager = new SessionManager();
