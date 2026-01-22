<script lang="ts">
    import FocusTrap from "./FocusTrap.svelte";
    import { Button } from "../../../primitives/Button"; // Or relative: ../../../primitives/Button
    import { Input } from "../../../primitives/Input";

    // We use relative here to be consistent with previous fixes if needed, but let's try $lib if vite handles it.
    // Actually, let's use relative to be safe for tests if they run without path aliases, though storybook should be fine.
    // I'll stick to $lib for now, if it breaks I fix.
    // Wait, ThemeToggle test broke on $lib. Vitest/Bun test env issue.
    // Storybook uses Vite, which has aliases.

    let {
        active = false,
        returnFocus = true,
    }: { active?: boolean; returnFocus?: boolean } = $props();

    // svelte-ignore state_referenced_locally
    let isOpen = $state(active);

    $effect(() => {
        isOpen = active;
    });

    function toggle() {
        isOpen = !isOpen;
    }
</script>

<div class="demo-layout">
    <div class="demo-controls">
        <Button onclick={toggle} variant={isOpen ? "secondary" : "primary"}>
            {isOpen ? "Close Trap" : "Open Trap"}
        </Button>
    </div>

    <div class="demo-section">
        <label class="demo-label" for="input-outside-1"
            >Outside Input (Before)</label
        >
        <Input
            id="input-outside-1"
            placeholder="Should be reachable if trap closed"
        />
    </div>

    <div class="trap-container {isOpen ? 'trap-container--active' : ''}">
        <div class="trap-header">
            <h3 class="trap-title">Trap Area</h3>
            <span
                class="trap-status {isOpen
                    ? 'trap-status--active'
                    : 'trap-status--inactive'}"
            >
                {isOpen ? "Active" : "Inactive"}
            </span>
        </div>

        <FocusTrap active={isOpen} {returnFocus}>
            <div class="trap-content">
                <p class="trap-description">
                    Focus stays within this box when active. Escape key
                    deactivates.
                </p>
                <div class="trap-form">
                    <Input placeholder="First input inside" />
                    <Input placeholder="Second input inside" />
                </div>
                <div class="trap-actions">
                    <Button
                        variant="secondary"
                        onclick={() => (isOpen = false)}
                        class="full-width"
                    >
                        Close from inside
                    </Button>
                </div>
            </div>
        </FocusTrap>
    </div>

    <div class="demo-section">
        <label class="demo-label" for="input-outside-2"
            >Outside Input (After)</label
        >
        <Input
            id="input-outside-2"
            placeholder="Should be reachable if trap closed"
        />
    </div>
</div>

<style>
    .demo-layout {
        display: flex;
        flex-direction: column;
        gap: var(--space-6);
        padding: var(--space-6);
        max-width: 32rem; /* 512px */
        margin: 0 auto;
        font-family: var(--font-ui);
        color: var(--color-text-primary);
    }

    .demo-controls {
        display: flex;
        justify-content: flex-start;
    }

    .demo-section {
        display: flex;
        flex-direction: column;
        gap: var(--space-2);
    }

    .demo-label {
        font-size: var(--text-sm);
        font-weight: 500;
        color: var(--color-text-secondary);
    }

    /* Trap Box Styling */
    .trap-container {
        border: 1px solid var(--color-border);
        border-radius: var(--radius-md);
        background: var(--color-bg-surface);
        padding: var(--space-5);
        transition: all var(--duration-normal) var(--ease-out);
        box-shadow: var(--shadow-sm);
    }

    .trap-container--active {
        border-color: var(--color-primary);
        box-shadow: 0 0 0 2px
            color-mix(in srgb, var(--color-primary) 10%, transparent);
    }

    .trap-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: var(--space-4);
        padding-bottom: var(--space-3);
        border-bottom: 1px solid var(--color-border);
    }

    .trap-title {
        font-size: var(--text-base);
        font-weight: 600;
        margin: 0;
        color: var(--color-text-primary);
    }

    .trap-status {
        font-size: var(--text-xs);
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        padding: var(--space-1) var(--space-2);
        border-radius: var(--radius-full);
        background: var(--color-bg-secondary);
        color: var(--color-text-tertiary);
    }

    .trap-status--active {
        background: color-mix(in srgb, var(--color-success) 10%, transparent);
        color: var(--color-success);
    }

    .trap-status--inactive {
        background: var(--color-bg-secondary);
        color: var(--color-text-tertiary);
    }

    .trap-content {
        display: flex;
        flex-direction: column;
        gap: var(--space-4);
    }

    .trap-description {
        font-size: var(--text-sm);
        color: var(--color-text-secondary);
        margin: 0;
    }

    .trap-form {
        display: flex;
        flex-direction: column;
        gap: var(--space-3);
    }

    .trap-actions {
        display: flex;
        justify-content: flex-end;
        padding-top: var(--space-2);
    }
</style>
