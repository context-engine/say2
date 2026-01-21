<!-- src/lib/primitives/Spinner/Spinner.svelte -->
<script lang="ts" module>
	export interface Props {
		size?: "sm" | "md" | "lg";
		color?: string;
		label?: string;
	}
</script>

<script lang="ts">
	const {
		size = "md",
		color = "var(--color-text-primary)",
		label = "Loading",
	}: Props = $props();
</script>

<span class="ce-spinner-wrapper" role="status" aria-label={label}>
	<svg
		class="ce-spinner ce-spinner--{size}"
		viewBox="0 0 24 24"
		fill="none"
		xmlns="http://www.w3.org/2000/svg"
		style="--spinner-color: {color}"
		aria-hidden="true"
	>
		<circle
			class="ce-spinner-track"
			cx="12"
			cy="12"
			r="10"
			stroke="currentColor"
			stroke-width="4"
		/>
		<circle
			class="ce-spinner-head"
			cx="12"
			cy="12"
			r="10"
			stroke="currentColor"
			stroke-width="4"
			stroke-linecap="round"
		/>
	</svg>
</span>

<style>
	/* Prefix: ce = Context Engine */
	.ce-spinner-wrapper {
		display: inline-flex;
		align-items: center;
		justify-content: center;
	}

	.ce-spinner {
		animation: spinner-rotate 1s linear infinite;
		color: var(--spinner-color);
	}

	.ce-spinner-track {
		opacity: 0.25;
	}

	.ce-spinner-head {
		opacity: 0.75;
		stroke-dasharray: 60;
		stroke-dashoffset: 45;
	}

	/* Sizes */
	.ce-spinner--sm {
		width: 0.875rem; /* 14px */
		height: 0.875rem;
	}

	.ce-spinner--md {
		width: 1.25rem; /* 20px */
		height: 1.25rem;
	}

	.ce-spinner--lg {
		width: 2rem; /* 32px */
		height: 2rem;
	}

	@keyframes spinner-rotate {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.ce-spinner {
			animation: none;
		}
	}
</style>
