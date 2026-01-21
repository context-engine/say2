<!-- src/lib/primitives/Checkbox/Checkbox.svelte -->
<script lang="ts">
	import { Checkbox } from "bits-ui";
	import { Check, Minus } from "lucide-svelte";

	interface Props {
		checked?: boolean;
		disabled?: boolean;
		label?: string;
		id?: string;
		indeterminate?: boolean;
		onchange?: (checked: boolean) => void;
	}

	const {
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
		{disabled}
		{id}
		onCheckedChange={(v) => onchange?.(v ?? false)}
		class="checkbox"
	>
		<div class="checkbox-indicator">
			{#if indeterminate}
				<Minus size={12} />
			{:else if checked}
				<Check size={12} />
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
		border: 2px solid var(--color-border);
		border-radius: var(--radius-sm);
		background: var(--color-bg-primary);
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all var(--duration-fast) var(--ease-out);
	}

	.checkbox:disabled {
		cursor: not-allowed;
		opacity: 0.5;
	}

	.checkbox:focus-visible {
		outline: 2px solid var(--color-info);
		outline-offset: 2px;
	}

	.checkbox[data-state="checked"] {
		background: var(--color-info);
		border-color: var(--color-info);
	}

	.checkbox[data-state="indeterminate"] {
		background: var(--color-warning);
		border-color: var(--color-warning);
	}

	.checkbox-indicator {
		color: white;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.checkbox-label {
		font-family: var(--font-ui);
		font-size: var(--text-base);
		color: var(--color-text-primary);
		cursor: pointer;
	}

	.checkbox-wrapper.disabled .checkbox-label {
		cursor: not-allowed;
	}
</style>
