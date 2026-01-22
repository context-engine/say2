<script lang="ts">
    import FilterPanel from "./FilterPanel.svelte";
    import type { FilterState } from "./FilterPanel.svelte";

    interface Props {
        direction?: FilterState["direction"];
        methods?: string[];
        hasError?: boolean | null;
        availableMethods?: string[];
    }

    let {
        direction = "all",
        methods = [],
        hasError = null,
        availableMethods = [
            "tools/list",
            "tools/call",
            "resources/read",
            "prompts/get",
        ],
    }: Props = $props();

    let filters = $state<FilterState>({
        direction,
        methods,
        hasError,
    });

    function handleChange(newFilters: FilterState) {
        filters = newFilters;
    }

    function handleReset() {
        filters = {
            direction: "all",
            methods: [],
            hasError: null,
        };
    }
</script>

<div style="padding: 1rem; max-width: 300px;">
    <FilterPanel
        {filters}
        {availableMethods}
        onchange={handleChange}
        onreset={handleReset}
    />

    <div
        style="margin-top: 1rem; padding: 1rem; background: var(--color-bg-secondary); border-radius: var(--radius-sm); font-family: var(--font-mono); font-size: var(--text-xs);"
    >
        <strong>Current State:</strong>
        <pre>{JSON.stringify(filters, null, 2)}</pre>
    </div>
</div>
