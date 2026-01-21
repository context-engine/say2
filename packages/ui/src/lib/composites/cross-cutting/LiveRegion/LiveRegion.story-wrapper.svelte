<script lang="ts">
    import LiveRegion from "./LiveRegion.svelte";
    import Button from "../../../primitives/Button/Button.svelte";
    import Input from "../../../primitives/Input/Input.svelte";
    import { onDestroy } from "svelte";

    let message = $state("");
    let announcement = $state("");
    let history: string[] = $state([]);
    let assertive = $state(false);

    function announce() {
        if (!message) return;
        announcement = message;
        history = [message, ...history];
        message = "";
    }

    // Clear announcement after a short delay so duplicate messages can be re-announced if logic supported (naive impl)
    // Actually LiveRegion usually needs text change to re-announce.
    // If the same text is sent, screen readers typically ignore it unless we clear it first.
    // For this demo, let's keep it simple.
</script>

<div class="demo-wrapper">
    <div class="controls">
        <Input
            bind:value={message}
            placeholder="Type message to announce..."
            onkeydown={(e: KeyboardEvent) => e.key === "Enter" && announce()}
        />
        <div class="actions">
            <label class="checkbox">
                <input type="checkbox" bind:checked={assertive} />
                Assertive (Interrupt)
            </label>
            <Button onclick={announce} disabled={!message}>Announce</Button>
        </div>
    </div>

    <!-- The actual component (hidden) -->
    <LiveRegion message={announcement} {assertive} />

    <div class="history">
        <h4>Announcement History (Visual Log)</h4>
        {#if history.length === 0}
            <p class="empty">No announcements yet.</p>
        {:else}
            <ul>
                {#each history as item, i}
                    <li>
                        <span class="time"
                            >{new Date().toLocaleTimeString()}</span
                        >
                        <span class="text">{item}</span>
                        {#if i === 0 && assertive}
                            <span class="badge">Assertive</span>
                        {/if}
                    </li>
                {/each}
            </ul>
        {/if}
    </div>
</div>

<style>
    .demo-wrapper {
        display: flex;
        flex-direction: column;
        gap: 2rem;
        padding: 2rem;
        max-width: 32rem;
        margin: 0 auto;
        font-family: var(--font-ui);
    }

    .controls {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        padding: 1.5rem;
        background: var(--color-bg-surface);
        border: 1px solid var(--color-border);
        border-radius: var(--radius-md);
        box-shadow: var(--shadow-sm);
    }

    .actions {
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .checkbox {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: var(--text-sm);
        color: var(--color-text-secondary);
        cursor: pointer;
    }

    .history {
        margin-top: 1rem;
    }

    h4 {
        margin: 0 0 0.5rem 0;
        font-size: var(--text-sm);
        color: var(--color-text-secondary);
        font-weight: 500;
    }

    .empty {
        font-style: italic;
        color: var(--color-text-tertiary);
        font-size: var(--text-sm);
    }

    ul {
        list-style: none;
        padding: 0;
        margin: 0;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    li {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.5rem;
        background: var(--color-bg-secondary);
        border-radius: var(--radius-sm);
        font-size: var(--text-sm);
    }

    .time {
        color: var(--color-text-tertiary);
        font-size: var(--text-xs);
        font-family: var(--font-mono);
    }

    .badge {
        font-size: 0.625rem;
        background: var(--color-error);
        color: white;
        padding: 2px 4px;
        border-radius: 4px;
        text-transform: uppercase;
    }
</style>
