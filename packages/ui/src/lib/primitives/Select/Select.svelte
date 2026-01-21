<!-- src/lib/primitives/Select/Select.svelte -->
<script lang="ts">
	import { Select } from "bits-ui";
	import { Check, ChevronDown } from "lucide-svelte";

	interface SelectOption {
		value: string;
		label: string;
		icon?: any;
		disabled?: boolean;
	}

	interface Props {
		value?: string;
		options?: SelectOption[];
		placeholder?: string;
		disabled?: boolean;
		size?: "sm" | "md";
		onchange?: (value: string) => void;
	}

	const {
		value = $bindable(""),
		options = [],
		placeholder = "Select...",
		disabled = false,
		size = "md",
		onchange,
	}: Props = $props();

	const selectedOption = $derived(
		options.find((o: SelectOption) => o.value === value),
	);
</script>

<Select.Root
	{value}
	onValueChange={(v) => onchange?.(v ?? "")}
	{disabled}
	type="single"
>
	<Select.Trigger
		class="select-trigger select-trigger--{size} {disabled
			? 'disabled'
			: ''}"
	>
		{#if selectedOption?.icon}
			<svelte:component
				this={selectedOption.icon}
				size={size === "sm" ? 14 : 16}
			/>
		{/if}
		<span class="select-value">
			{selectedOption?.label ?? placeholder}
		</span>
		<span class="select-icon">
			<ChevronDown size={size === "sm" ? 14 : 16} />
		</span>
	</Select.Trigger>

	<Select.Portal>
		<Select.Content class="select-content" sideOffset={4}>
			<Select.Viewport>
				{#each options as option}
					<Select.Item
						value={option.value}
						disabled={option.disabled}
						class="select-item {option.disabled
							? 'disabled'
							: ''} {value === option.value ? 'selected' : ''}"
						label={option.label}
					>
						{#if option.icon}
							<svelte:component
								this={option.icon}
								size={size === "sm" ? 14 : 16}
							/>
						{/if}
						<span class="select-item-label">{option.label}</span>
						{#if value === option.value}
							<span class="select-item-indicator">
								<Check size={size === "sm" ? 12 : 14} />
							</span>
						{/if}
					</Select.Item>
				{/each}
			</Select.Viewport>
		</Select.Content>
	</Select.Portal>
</Select.Root>

<style>
	.select-trigger {
		display: inline-flex;
		align-items: center;
		gap: var(--space-2);
		border: 1px solid var(--color-border);
		background: var(--color-bg-primary);
		cursor: pointer;
		font-family: var(--font-ui);
		transition: all var(--duration-fast) var(--ease-out);
	}

	.select-trigger:focus-visible {
		outline: 2px solid var(--color-info);
		outline-offset: 2px;
	}

	.select-trigger:hover:not(.disabled) {
		background: var(--color-bg-secondary);
	}

	.select-trigger.disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.select-trigger--sm {
		height: 28px;
		padding: 0 var(--space-3);
		font-size: var(--text-sm);
	}

	.select-trigger--md {
		height: 36px;
		padding: 0 var(--space-4);
		font-size: var(--text-base);
	}

	.select-value {
		flex: 1;
		text-align: left;
	}

	.select-icon {
		display: flex;
		align-items: center;
		opacity: 0.5;
	}

	.select-content {
		background: var(--color-bg-primary);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		box-shadow: var(--shadow-lg);
		overflow: hidden;
		z-index: var(--z-dropdown);
	}

	.select-item {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		padding: var(--space-2) var(--space-4);
		cursor: pointer;
		font-family: var(--font-ui);
		font-size: var(--text-base);
		transition: background var(--duration-fast) var(--ease-out);
	}

	.select-item:hover,
	.select-item[data-highlighted] {
		background: var(--color-bg-secondary);
	}

	.select-item.selected {
		background: var(--color-bg-tertiary);
	}

	.select-item.disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.select-item-label {
		flex: 1;
	}

	.select-item-indicator {
		display: flex;
		align-items: center;
		color: var(--color-text-secondary);
	}
</style>
