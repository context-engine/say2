/**
 * Session Manager
 *
 * Manages session lifecycle: create, get, list, close, updateState
 */

import {
	createSession,
	type ServerConfig,
	type Session,
	SessionState,
} from "../types";

export class SessionManager {
	private sessions: Map<string, Session> = new Map();

	/**
	 * Create a new session with the given server configuration.
	 */
	create(config: ServerConfig): Session {
		const session = createSession(config);
		this.sessions.set(session.id, session);
		return session;
	}

	/**
	 * Get a session by ID.
	 */
	get(id: string): Session | undefined {
		return this.sessions.get(id);
	}

	/**
	 * List all active sessions (not CLOSED or ERROR).
	 */
	list(): Session[] {
		return Array.from(this.sessions.values()).filter(
			(session) =>
				session.state !== SessionState.CLOSED &&
				session.state !== SessionState.ERROR,
		);
	}

	/**
	 * List all sessions including closed ones.
	 */
	listAll(): Session[] {
		return Array.from(this.sessions.values());
	}

	/**
	 * Close a session.
	 */
	close(id: string): void {
		const session = this.sessions.get(id);
		if (session) {
			session.state = SessionState.CLOSED;
			session.updatedAt = new Date();
		}
	}

	/**
	 * Update session state.
	 */
	updateState(id: string, state: SessionState): void {
		const session = this.sessions.get(id);
		if (session) {
			session.state = state;
			session.updatedAt = new Date();
		}
	}

	/**
	 * Update session capabilities.
	 */
	updateCapabilities(
		id: string,
		clientCapabilities?: Record<string, unknown>,
		serverCapabilities?: Record<string, unknown>,
	): void {
		const session = this.sessions.get(id);
		if (session) {
			if (clientCapabilities) {
				session.clientCapabilities = clientCapabilities;
			}
			if (serverCapabilities) {
				session.serverCapabilities = serverCapabilities;
			}
			session.updatedAt = new Date();
		}
	}

	/**
	 * Delete a session (remove from memory).
	 */
	delete(id: string): boolean {
		return this.sessions.delete(id);
	}

	/**
	 * Get count of sessions.
	 */
	count(): number {
		return this.sessions.size;
	}
}

// Export singleton instance for convenience
export const sessionManager = new SessionManager();
