<!-- src/lib/primitives/Tooltip/Tooltip.svelte -->
<script lang="ts">
import { Tooltip } from "bits-ui";
import type { Snippet } from "svelte";

interface Props {
	content?: string;
	side?: "top" | "right" | "bottom" | "left";
	delay?: number;
	children?: Snippet;
}

const { content = "", side = "top", delay = 300, children }: Props = $props();
</script>

<Tooltip.Root delayDuration={delay}>
	<Tooltip.Trigger class="tooltip-trigger">
		{@render children?.()}
	</Tooltip.Trigger>
	<Tooltip.Portal>
		<Tooltip.Content
			class="tooltip-content"
			{side}
			sideOffset={4}
		>
			{content}
			<Tooltip.Arrow class="tooltip-arrow" />
		</Tooltip.Content>
	</Tooltip.Portal>
</Tooltip.Root>

<style>
	.tooltip-trigger {
		display: inline-flex;
		cursor: pointer;
	}

	.tooltip-content {
		background: var(--color-bg-primary);
		color: var(--color-text-primary);
		padding: var(--space-2) var(--space-3);
		border-radius: var(--radius-sm);
		font-family: var(--font-ui);
		font-size: var(--text-sm);
		box-shadow: var(--shadow-md);
		z-index: var(--z-tooltip);
		max-width: 250px;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.tooltip-arrow {
		fill: var(--color-bg-primary);
	}
</style>
