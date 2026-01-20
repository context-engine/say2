<!-- src/lib/primitives/StatusDot/StatusDot.svelte -->
<script lang="ts">
  interface Props {
    /** Status color variant */
    status?: 'success' | 'warning' | 'error' | 'info' | 'neutral';
    /** Animated pulse effect */
    pulse?: boolean;
    /** Dot size */
    size?: 'sm' | 'md';
    /** Accessible label */
    label?: string;
    /** Additional classes */
    class?: string;
  }
  
  let { 
    status = 'neutral',
    pulse = false,
    size = 'md',
    label,
    class: className,
    ...rest
  }: Props = $props();
</script>

{#if label}
  <span class="sr-only">{label}</span>
{/if}

<div 
  class="status-dot status-dot--{status} status-dot--{size} {pulse ? 'status-dot--pulse' : ''} {className || ''}"
  role="status"
  aria-label={label}
  {...rest}
></div>

<style>
  .status-dot {
    border-radius: 50%;
    display: inline-block;
    flex-shrink: 0;
  }

  /* Sizes */
  .status-dot--sm {
    width: 6px;
    height: 6px;
  }

  .status-dot--md {
    width: 8px;
    height: 8px;
  }

  /* Variants */
  .status-dot--neutral {
    background-color: var(--color-text-tertiary);
  }

  .status-dot--success {
    background-color: var(--color-success);
  }

  .status-dot--warning {
    background-color: var(--color-warning);
  }

  .status-dot--error {
    background-color: var(--color-error);
  }

  .status-dot--info {
    background-color: var(--color-info);
  }

  /* Pulse Animation */
  .status-dot--pulse {
    animation: status-pulse 2s ease-in-out infinite;
  }

  @keyframes status-pulse {
    0% {
      opacity: 1;
      transform: scale(1);
    }
    50% {
      opacity: 0.5;
      transform: scale(0.9);
    }
    100% {
      opacity: 1;
      transform: scale(1);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .status-dot--pulse {
      animation: none;
    }
  }

  /* Utils */
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border-width: 0;
  }
</style>
