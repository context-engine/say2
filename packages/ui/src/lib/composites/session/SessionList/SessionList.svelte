<script lang="ts" module>
    import type { Session } from "../SessionCard/SessionCard.svelte";

    export interface Props {
        /** Array of sessions to display */
        sessions: Session[];
        /** Currently selected session ID */
        selectedId?: string;
        /** Search query string */
        searchQuery?: string;
        /** Loading state */
        loading?: boolean;
        /** Add session handler */
        onAddSession?: () => void;
        /** Selection handler */
        onSelect?: (id: string) => void;
        /** Search handler */
        onSearch?: (term: string) => void;
    }
</script>

<script lang="ts">
    import SessionCard from "../SessionCard/SessionCard.svelte";
    import Input from "../../../primitives/Input/Input.svelte";
    import Button from "../../../primitives/Button/Button.svelte";
    import EmptyState from "../../cross-cutting/EmptyState/EmptyState.svelte";
    import { Plus, Search } from "lucide-svelte";

    let {
        sessions = [],
        selectedId,
        searchQuery = $bindable(""),
        loading = false,
        onAddSession,
        onSelect,
        onSearch,
    }: Props = $props();

    let filteredSessions = $derived(
        sessions.filter(
            (s) =>
                s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                s.serverCommand
                    ?.toLowerCase()
                    .includes(searchQuery.toLowerCase()),
        ),
    );

    const handleSearch = (val: string) => {
        onSearch?.(val);
    };
</script>

<div class="ce-session-list">
    <div class="ce-session-list__header">
        <h2 class="ce-session-list__title">Sessions</h2>
        <Button
            variant="ghost"
            size="sm"
            onclick={onAddSession}
            icon={Plus}
            iconOnly
            aria-label="Add Session"
        />
    </div>

    <div class="ce-session-list__search">
        <Input
            placeholder="Search sessions..."
            bind:value={searchQuery}
            oninput={handleSearch}
            icon={Search}
            size="sm"
        />
    </div>

    <div class="ce-session-list__content">
        {#if filteredSessions.length > 0}
            <div class="ce-session-list__items">
                {#each filteredSessions as session (session.id)}
                    <SessionCard
                        {session}
                        selected={session.id === selectedId}
                        onClick={() => onSelect?.(session.id)}
                    />
                {/each}
            </div>
        {:else if !loading}
            <div class="ce-session-list__empty">
                <EmptyState
                    title={searchQuery ? "No results found" : "No sessions yet"}
                    description={searchQuery
                        ? `No sessions matching "${searchQuery}"`
                        : "Create a new session to get started."}
                    icon={searchQuery ? Search : undefined}
                />
            </div>
        {/if}
    </div>
</div>

<style>
    .ce-session-list {
        display: flex;
        flex-direction: column;
        height: 100%;
        background: var(--color-bg-secondary);
        border-right: 1px solid var(--color-border);
        font-family: var(--font-ui);
    }

    .ce-session-list__header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: var(--space-4) var(--space-4) var(--space-2);
    }

    .ce-session-list__title {
        margin: 0;
        font-size: var(--text-lg);
        font-weight: 600;
        color: var(--color-text-primary);
    }

    .ce-session-list__search {
        padding: var(--space-2) var(--space-4);
    }

    .ce-session-list__content {
        flex: 1;
        overflow-y: auto;
        padding: var(--space-2) var(--space-4) var(--space-4);
    }

    .ce-session-list__items {
        display: flex;
        flex-direction: column;
        gap: var(--space-2);
    }

    .ce-session-list__empty {
        padding-top: var(--space-8);
    }
</style>
