<script lang="ts" module>
    export type SessionStatus =
        | "active"
        | "connected"
        | "pending"
        | "error"
        | "disconnected";

    export interface Session {
        id: string;
        name: string;
        status: SessionStatus;
        messageCount: number;
        createdAt: Date;
        serverCommand?: string;
    }

    export interface Props {
        /** Session data object */
        session: Session;
        /** Currently selected state */
        selected?: boolean;
        /** Selection handler */
        onClick?: () => void;
    }
</script>

<script lang="ts">
    import StatusDot from "../../../primitives/StatusDot/StatusDot.svelte";
    import Badge from "../../../primitives/Badge/Badge.svelte";
    import { ChevronRight } from "lucide-svelte";

    let { session, selected = false, onClick }: Props = $props();

    const statusMap = {
        active: "success",
        connected: "success",
        pending: "warning",
        error: "error",
        disconnected: "neutral",
    } as const;

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
        });
    };
</script>

<button
    type="button"
    class="ce-session-card {selected ? 'ce-session-card--selected' : ''}"
    onclick={onClick}
    aria-current={selected ? "true" : undefined}
>
    <div class="ce-session-card__status">
        <StatusDot
            status={statusMap[session.status]}
            pulse={session.status === "active" ||
                session.status === "connected"}
            label={session.status}
        />
    </div>

    <div class="ce-session-card__content">
        <div class="ce-session-card__header">
            <span class="ce-session-card__name">{session.name}</span>
            <span class="ce-session-card__time"
                >{formatTime(session.createdAt)}</span
            >
        </div>
        <div class="ce-session-card__meta">
            <Badge variant="info">{session.messageCount} messages</Badge>
            {#if session.serverCommand}
                <span class="ce-session-card__command"
                    >{session.serverCommand}</span
                >
            {/if}
        </div>
    </div>

    <div class="ce-session-card__arrow">
        <ChevronRight size={16} />
    </div>
</button>

<style>
    .ce-session-card {
        display: flex;
        align-items: center;
        gap: var(--space-3);
        width: 100%;
        padding: var(--space-3) var(--space-4);
        background: var(--color-bg-secondary);
        border: 1px solid transparent;
        border-radius: var(--radius-md);
        cursor: pointer;
        font-family: var(--font-ui);
        text-align: left;
        transition:
            background var(--duration-fast) var(--ease-out),
            border-color var(--duration-fast) var(--ease-out);
    }

    .ce-session-card:hover {
        background: var(--color-bg-tertiary);
    }

    .ce-session-card--selected {
        background: var(--color-bg-tertiary);
        border-color: var(--color-info);
    }

    .ce-session-card__status {
        flex-shrink: 0;
    }

    .ce-session-card__content {
        flex: 1;
        min-width: 0;
        display: flex;
        flex-direction: column;
        gap: var(--space-1);
    }

    .ce-session-card__header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: var(--space-2);
    }

    .ce-session-card__name {
        font-size: var(--text-sm);
        font-weight: 600;
        color: var(--color-text-primary);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .ce-session-card__time {
        font-size: var(--text-xs);
        color: var(--color-text-tertiary);
        flex-shrink: 0;
    }

    .ce-session-card__meta {
        display: flex;
        align-items: center;
        gap: var(--space-2);
    }

    .ce-session-card__command {
        font-size: var(--text-xs);
        color: var(--color-text-secondary);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .ce-session-card__arrow {
        flex-shrink: 0;
        color: var(--color-text-tertiary);
    }
</style>
