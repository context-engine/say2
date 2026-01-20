<!-- src/lib/primitives/Spinner/Spinner.svelte -->
<script lang="ts">
interface Props {
	size?: "sm" | "md" | "lg";
	color?: string;
	label?: string;
}

const {
	size = "md",
	color = "currentColor",
	label = "Loading",
}: Props = $props();
</script>

<span class="spinner-wrapper" role="status" aria-label={label}>
	<svg
		class="spinner spinner--{size}"
		viewBox="0 0 24 24"
		fill="none"
		xmlns="http://www.w3.org/2000/svg"
		style="--spinner-color: {color}"
		aria-hidden="true"
	>
		<circle
			class="spinner-track"
			cx="12"
			cy="12"
			r="10"
			stroke="currentColor"
			stroke-width="4"
		/>
		<circle
			class="spinner-head"
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
	.spinner-wrapper {
		display: inline-flex;
		align-items: center;
		justify-content: center;
	}

	.spinner {
		animation: spinner-rotate 1s linear infinite;
		color: var(--spinner-color);
	}

	.spinner-track {
		opacity: 0.25;
	}

	.spinner-head {
		opacity: 0.75;
		stroke-dasharray: 60;
		stroke-dashoffset: 45;
	}

	/* Sizes */
	.spinner--sm {
		width: 14px;
		height: 14px;
	}

	.spinner--md {
		width: 20px;
		height: 20px;
	}

	.spinner--lg {
		width: 32px;
		height: 32px;
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
		.spinner {
			animation: none;
		}
	}
</style>
