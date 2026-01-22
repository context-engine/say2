<!-- src/lib/primitives/Toast/ToastItem.svelte -->
<script lang="ts" module>
	import type { Toast } from "./toast.store";

	export interface Props {
		toast: Toast;
	}
</script>

<script lang="ts">
	import { TriangleAlert, Check, Info, X, X as XIcon } from "lucide-svelte";
	import { toasts } from "./toast.store";

	const { toast }: Props = $props();

	const iconMap = {
		success: Check,
		error: X,
		warning: TriangleAlert,
		info: Info,
	};

	const colorMap = {
		success: "var(--color-success)",
		error: "var(--color-error)",
		warning: "var(--color-warning)",
		info: "var(--color-info)",
	};

	// Get icon component dynamically
	const IconComponent = $derived(iconMap[toast.type]);
</script>

<div class="ce-toast ce-toast-{toast.type}" role="alert">
	<div class="ce-toast-icon" style="color: {colorMap[toast.type]}">
		<IconComponent size={18} />
	</div>
	<p class="ce-toast-message">{toast.message}</p>
	{#if toast.dismissable}
		<button
			class="ce-toast-close"
			onclick={() => toasts.removeToast(toast.id)}
			aria-label="Dismiss"
		>
			<XIcon size={14} />
		</button>
	{/if}
</div>

<style>
	/* Prefix: ce = Context Engine */
	.ce-toast {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		padding: var(--space-3) var(--space-4);
		background: var(--color-bg-primary);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		box-shadow: var(--shadow-lg);
		min-width: 280px;
		max-width: 400px;
		animation: slideIn var(--duration-normal) var(--ease-out);
	}

	.ce-toast-icon {
		flex-shrink: 0;
		display: flex;
		align-items: center;
	}

	.ce-toast-message {
		flex: 1;
		font-family: var(--font-ui);
		font-size: var(--text-sm);
		color: var(--color-text-primary);
		margin: 0;
	}

	.ce-toast-close {
		flex-shrink: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 20px;
		height: 20px;
		padding: 0;
		border: none;
		background: transparent;
		color: var(--color-text-tertiary);
		cursor: pointer;
		border-radius: var(--radius-sm);
		transition: all var(--duration-fast) var(--ease-out);
	}

	.ce-toast-close:hover {
		background: var(--color-bg-secondary);
		color: var(--color-text-primary);
	}

	.ce-toast-success {
		border-left: 3px solid var(--color-success);
	}

	.ce-toast-error {
		border-left: 3px solid var(--color-error);
	}

	.ce-toast-warning {
		border-left: 3px solid var(--color-warning);
	}

	.ce-toast-info {
		border-left: 3px solid var(--color-info);
	}

	@keyframes slideIn {
		from {
			opacity: 0;
			transform: translateY(10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
</style>
