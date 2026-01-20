<!-- src/lib/primitives/Toast/ToastItem.svelte -->
<script lang="ts">
import { AlertTriangle, Check, Info, X, X as XIcon } from "lucide-svelte";
import { type Toast, toasts } from "./toast.store";

interface Props {
	toast: Toast;
}

const { toast }: Props = $props();

const iconMap = {
	success: Check,
	error: X,
	warning: AlertTriangle,
	info: Info,
};

const colorMap = {
	success: "var(--color-success)",
	error: "var(--color-error)",
	warning: "var(--color-warning)",
	info: "var(--color-info)",
};
</script>

<div class="toast toast-{toast.type}" role="alert">
	<div class="toast-icon" style="color: {colorMap[toast.type]}">
		<svelte:component this={iconMap[toast.type]} size={18} />
	</div>
	<p class="toast-message">{toast.message}</p>
	{#if toast.dismissable}
		<button
			class="toast-close"
			onclick={() => toasts.removeToast(toast.id)}
			aria-label="Dismiss"
		>
			<XIcon size={14} />
		</button>
	{/if}
</div>

<style>
	.toast {
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

	.toast-icon {
		flex-shrink: 0;
		display: flex;
		align-items: center;
	}

	.toast-message {
		flex: 1;
		font-family: var(--font-ui);
		font-size: var(--text-sm);
		color: var(--color-text-primary);
		margin: 0;
	}

	.toast-close {
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

	.toast-close:hover {
		background: var(--color-bg-secondary);
		color: var(--color-text-primary);
	}

	.toast-success {
		border-left: 3px solid var(--color-success);
	}

	.toast-error {
		border-left: 3px solid var(--color-error);
	}

	.toast-warning {
		border-left: 3px solid var(--color-warning);
	}

	.toast-info {
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
