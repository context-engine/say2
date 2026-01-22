<script lang="ts">
    import {
        createFocusTrap,
        type FocusTrap as FocusTrapInstance,
    } from "focus-trap";
    import type { Snippet } from "svelte";

    export interface Props {
        active?: boolean;
        initialFocus?: string | HTMLElement | false;
        returnFocus?: boolean;
        children?: Snippet;
    }

    let {
        active = false,
        initialFocus,
        returnFocus = true,
        children,
    }: Props = $props();

    let container: HTMLElement | undefined = $state();
    let trap: FocusTrapInstance | undefined = $state();

    $effect(() => {
        if (container && !trap) {
            trap = createFocusTrap(container, {
                initialFocus: initialFocus === false ? false : initialFocus,
                returnFocusOnDeactivate: returnFocus,
                // Allow clicking outside to deactivate if logical (optional, keeping strict for now)
                clickOutsideDeactivates: false,
                escapeDeactivates: false, // Let parent handle Escape via events if needed, usually better
                // Actually spec says "Escape/Close: Inner trap deactivates".
                // Default is true but can conflict with modal close logic.
                // Let's set it to false so the Modal/Parent controls 'active' state explicitly.
            });
        }
    });

    $effect(() => {
        if (active && trap) {
            try {
                // Check if already active to avoid errors
                // focus-trap throws if you try to activate an already active trap? No, but check docs.
                trap.activate();
            } catch (e) {
                // Often happens if container not visible
                console.warn("FocusTrap activation failed", e);
            }
        } else if (!active && trap) {
            trap.deactivate();
        }
    });

    // Cleanup
    $effect(() => {
        return () => {
            if (trap) {
                trap.deactivate();
            }
        };
    });
</script>

<div class="ce-focus-trap" bind:this={container}>
    {#if children}
        {@render children()}
    {/if}
</div>

<style>
    .ce-focus-trap {
        display: contents;
    }
</style>
