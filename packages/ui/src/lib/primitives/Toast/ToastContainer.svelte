<!-- src/lib/primitives/Toast/ToastContainer.svelte -->
<script lang="ts">
import ToastItem from "./ToastItem.svelte";
import { type Toast, toasts } from "./toast.store";

let toastList: Toast[] = [];

toasts.subscribe((value) => {
	toastList = value;
});
</script>

<div class="toast-container" role="region" aria-label="Notifications" aria-live="polite">
	{#each toastList as toast (toast.id)}
		<ToastItem {toast} />
	{/each}
</div>

<style>
	.toast-container {
		position: fixed;
		bottom: var(--space-4);
		right: var(--space-4);
		z-index: var(--z-toast);
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
		max-width: 400px;
		pointer-events: none;
	}

	.toast-container > * {
		pointer-events: auto;
	}
</style>
