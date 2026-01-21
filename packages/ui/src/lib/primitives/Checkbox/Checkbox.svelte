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

<div class="ce-checkbox-wrapper" class:disabled>
	<Checkbox.Root
		{checked}
		{indeterminate}
		{disabled}
		{id}
		onCheckedChange={(v) => {
			checked = v;
			onchange?.(v);
		}}
		class="ce-checkbox {indeterminate ? 'ce-checkbox--indeterminate' : ''}"
	>
		<div class="ce-checkbox-indicator">
			{#if indeterminate}
				<Minus size={12} strokeWidth={3} />
			{:else if checked}
				<Check size={12} strokeWidth={3} />
			{/if}
		</div>
	</Checkbox.Root>
	{#if label}
		<label for={id} class="ce-checkbox-label">
			{label}
		</label>
	{/if}
</div>

<style>
	/* Prefix: ce = Context Engine */
	.ce-checkbox-wrapper {
		display: inline-flex;
		align-items: center;
		gap: var(--space-2);
	}

	.ce-checkbox-wrapper.disabled {
		opacity: 0.5;
	}

	:global(.ce-checkbox) {
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

	:global(.ce-checkbox:hover:not(:disabled)) {
		border-color: var(--color-text-secondary);
		background: var(--color-bg-secondary);
	}

	:global(.ce-checkbox:active:not(:disabled)) {
		transform: scale(0.95);
		background: var(--color-bg-tertiary);
	}

	:global(.ce-checkbox:disabled) {
		cursor: not-allowed;
		opacity: 0.5;
		background: var(--color-bg-secondary);
	}

	:global(.ce-checkbox:focus-visible) {
		outline: 2px solid var(--color-info);
		outline-offset: 2px;
	}

	:global(.ce-checkbox[data-state="checked"]) {
		background: var(--color-info);
		border-color: var(--color-info);
		color: white;
	}

	:global(.ce-checkbox[data-state="checked"]:hover:not(:disabled)) {
		background: color-mix(in srgb, var(--color-info) 90%, black);
		border-color: color-mix(in srgb, var(--color-info) 90%, black);
	}

	:global(.ce-checkbox.ce-checkbox--indeterminate) {
		background: var(--color-info);
		border-color: var(--color-info);
		color: white;
	}

	.ce-checkbox-indicator {
		color: currentColor;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 100%;
		height: 100%;
		pointer-events: none;
	}

	.ce-checkbox-label {
		font-family: var(--font-ui);
		font-size: var(--text-base);
		color: var(--color-text-primary);
		cursor: pointer;
		user-select: none;
	}

	.ce-checkbox-wrapper.disabled .ce-checkbox-label {
		cursor: not-allowed;
	}
</style>
