<script lang="ts">
    import ExpandCollapse from "./ExpandCollapse.svelte";

    interface Props {
        label?: string;
        startExpanded?: boolean;
    }

    let {
        label = "Toggle Details",
        startExpanded: initialExpanded = false,
    }: Props = $props();
    let expanded = $state(false);

    // Sync expanded state whenever the initialExpanded prop changes (e.g. from Storybook controls)
    $effect.pre(() => {
        expanded = initialExpanded;
    });

    function handleToggle() {
        expanded = !expanded;
    }
</script>

<div style="padding: 1rem; width: 100%; max-width: 500px;">
    <ExpandCollapse {expanded} ontoggle={handleToggle} {label}>
        <div style="padding: 0.5rem 0;">
            <p style="margin: 0 0 0.5rem 0; color: var(--color-text-primary);">
                This content is revealed when expanded.
            </p>
            <p style="margin: 0; color: var(--color-text-secondary);">
                It supports any HTML or components via snippet.
            </p>
        </div>
    </ExpandCollapse>
</div>
