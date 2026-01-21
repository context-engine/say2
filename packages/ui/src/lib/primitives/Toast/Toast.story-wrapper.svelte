<!-- src/lib/primitives/Toast/Toast.story-wrapper.svelte -->
<script lang="ts">
    import ToastContainer from "./ToastContainer.svelte";
    import { toasts } from "./toast.store";
    import Button from "../Button/Button.svelte";
</script>

<div class="story-container">
    <ToastContainer />

    <div class="actions">
        <Button onclick={() => toasts.success("Copied to clipboard!")}>
            Success Toast
        </Button>
        <Button onclick={() => toasts.error("Failed to save changes")}>
            Error Toast
        </Button>
        <Button onclick={() => toasts.warning("Connection unstable")}>
            Warning Toast
        </Button>
        <Button onclick={() => toasts.info("New message received")}>
            Info Toast
        </Button>
    </div>
</div>

<style>
    .story-container {
        position: relative;
        height: 400px;
        padding: var(--space-4);
    }

    .actions {
        display: flex;
        flex-direction: column;
        gap: var(--space-3);
        align-items: flex-start;
        max-width: 200px;
    }
</style>
