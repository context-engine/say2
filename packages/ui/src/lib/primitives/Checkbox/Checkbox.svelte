<!-- src/lib/primitives/Checkbox/Checkbox.svelte -->
<script lang="ts" module>
	export interface Props {
		checked?: boolean;
		disabled?: boolean;
		label?: string;
		id?: string;
		indeterminate?: boolean;
		onchange?: (checked: boolean) => void;
	}
</script>

<script lang="ts">
	import { Checkbox } from "bits-ui";
	import { Check, Minus } from "lucide-svelte";

	let {
		checked = $bindable(false),
		disabled = false,
		label,
		id = `checkbox-${Math.random().toString(36).slice(2, 9)}`,
		indeterminate = false,
		onchange,
	}: Props = $props();
</script>

<div class="checkbox-wrapper" class:disabled>
	<Checkbox.Root
		{checked}
		{indeterminate}
		{disabled}
		{id}
		onCheckedChange={(v) => {
			checked = v;
			onchange?.(v);
		}}
		class="checkbox {indeterminate ? 'checkbox--indeterminate' : ''}"
	>
		<div class="checkbox-indicator">
			{#if indeterminate}
				<Minus size={12} strokeWidth={3} />
			{:else if checked}
				<Check size={12} strokeWidth={3} />
			{/if}
		</div>
	</Checkbox.Root>
	{#if label}
		<label for={id} class="checkbox-label">
			{label}
		</label>
	{/if}
</div>

<style>
	.checkbox-wrapper {
		display: inline-flex;
		align-items: center;
		gap: var(--space-2);
	}

	.checkbox-wrapper.disabled {
		opacity: 0.5;
	}

	.checkbox {
		cursor: pointer;
		width: 18px;
		height: 18px;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		background: var(--color-bg-primary);
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all var(--duration-fast) var(--ease-out);
		padding: 0;
		margin: 0;
	}

	.checkbox:hover:not(:disabled) {
		border-color: var(--color-text-secondary);
		background: var(--color-bg-secondary);
	}

	/* Active state for better feel */
	.checkbox:active:not(:disabled) {
		transform: scale(0.95);
		background: var(--color-bg-tertiary);
	}

	.checkbox:disabled {
		cursor: not-allowed;
		opacity: 0.5;
		background: var(--color-bg-secondary);
	}

	.checkbox:focus-visible {
		outline: 2px solid var(--color-info);
		outline-offset: 2px;
	}

	.checkbox[data-state="checked"] {
		background: var(--color-info);
		border-color: var(--color-info);
		color: white;
	}

	.checkbox[data-state="checked"]:hover:not(:disabled) {
		background: color-mix(in srgb, var(--color-info) 90%, black);
		border-color: color-mix(in srgb, var(--color-info) 90%, black);
	}

	.checkbox.checkbox--indeterminate {
		background: var(
			--color-info
		); /* Use info color for indeterminate too, usually standard */
		border-color: var(--color-info);
		color: white;
	}

	.checkbox-indicator {
		color: currentColor;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 100%;
		height: 100%;
		pointer-events: none;
	}

	.checkbox-label {
		font-family: var(--font-ui);
		font-size: var(--text-base);
		color: var(--color-text-primary);
		cursor: pointer;
		user-select: none;
	}

	.checkbox-wrapper.disabled .checkbox-label {
		cursor: not-allowed;
	}
</style>
