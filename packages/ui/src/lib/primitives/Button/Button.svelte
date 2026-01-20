<!-- src/lib/primitives/Button/Button.svelte -->
<script lang="ts">
import { Button } from "bits-ui";
import type { ComponentType, Snippet } from "svelte";

interface Props {
	variant?: "primary" | "secondary" | "ghost" | "danger";
	size?: "sm" | "md" | "lg";
	disabled?: boolean;
	loading?: boolean;
	icon?: ComponentType<any>;
	iconOnly?: boolean;
	onclick?: (event: MouseEvent) => void;
	children?: Snippet;
	"aria-label"?: string;
}

const {
	variant = "primary",
	size = "md",
	disabled = false,
	loading = false,
	icon: Icon,
	iconOnly = false,
	onclick,
	children,
	...rest
}: Props = $props();
</script>

<Button.Root
	disabled={disabled || loading}
	onclick={onclick}
	class="button button--{variant} button--{size} {iconOnly ? 'button--icon-only' : ''}"
	aria-busy={loading}
	aria-label={rest['aria-label']}
	{...rest}
>
	{#if loading}
		<span class="spinner" aria-hidden="true">
			<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
				<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
				<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
			</svg>
		</span>
	{:else if Icon}
		<span class="button-icon">
			<Icon size={size === 'sm' ? 14 : size === 'lg' ? 18 : 16} />
		</span>
	{/if}

	{#if children && !iconOnly}
		{@render children()}
	{/if}
</Button.Root>

<style>
	.button {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: var(--space-2);
		border: none;
		cursor: pointer;
		font-family: var(--font-ui);
		font-weight: var(--font-medium);
		border-radius: var(--radius-sm);
		transition: all var(--duration-fast) var(--ease-out);
		white-space: nowrap;
	}

	.button:disabled {
		cursor: not-allowed;
		opacity: 0.6;
	}

	.button:focus-visible {
		outline: 2px solid var(--color-info);
		outline-offset: 2px;
	}

	/* Sizes */
	.button--sm {
		height: 28px;
		padding: 0 var(--space-3);
		font-size: var(--text-sm);
	}

	.button--md {
		height: 36px;
		padding: 0 var(--space-4);
		font-size: var(--text-base);
	}

	.button--lg {
		height: 44px;
		padding: 0 var(--space-6);
		font-size: var(--text-base);
	}

	.button--icon-only {
		padding: 0;
		aspect-ratio: 1;
	}

	.button--icon-only.button--sm {
		width: 28px;
	}

	.button--icon-only.button--md {
		width: 36px;
	}

	.button--icon-only.button--lg {
		width: 44px;
	}

	/* Variants */
	.button--primary {
		background: var(--color-info);
		color: white;
	}

	.button--primary:hover:not(:disabled) {
		filter: brightness(1.1);
	}

	.button--secondary {
		background: var(--color-bg-secondary);
		color: var(--color-text-primary);
		border: 1px solid var(--color-border);
	}

	.button--secondary:hover:not(:disabled) {
		background: var(--color-bg-tertiary);
	}

	.button--ghost {
		background: transparent;
		color: var(--color-text-primary);
	}

	.button--ghost:hover:not(:disabled) {
		background: var(--color-bg-tertiary);
	}

	.button--danger {
		background: var(--color-error);
		color: white;
	}

	.button--danger:hover:not(:disabled) {
		filter: brightness(0.9);
	}

	/* Spinner */
	.spinner {
		display: flex;
		align-items: center;
	}

	.spinner svg {
		animation: spin 1s linear infinite;
		height: 1em;
		width: 1em;
	}

	.opacity-25 {
		opacity: 0.25;
	}

	.opacity-75 {
		opacity: 0.75;
	}

	@keyframes spin {
		from {
			transform: rotate(0deg);
		}

		to {
			transform: rotate(360deg);
		}
	}

	.button-icon {
		display: flex;
		align-items: center;
	}
</style>
