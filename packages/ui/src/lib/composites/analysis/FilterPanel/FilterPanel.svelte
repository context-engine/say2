<script lang="ts" module>
    export interface FilterState {
        direction: "all" | "inbound" | "outbound";
        methods: string[];
        hasError: boolean | null;
    }

    export interface Props {
        /** Current filter state */
        filters: FilterState;
        /** Available methods to filter by */
        availableMethods?: string[];
        /** Filter change handler */
        onchange?: (filters: FilterState) => void;
        /** Reset all filters */
        onreset?: () => void;
    }
</script>

<script lang="ts">
    import Select from "../../../primitives/Select/Select.svelte";
    import type { SelectOption } from "../../../primitives/Select/Select.svelte";
    import Checkbox from "../../../primitives/Checkbox/Checkbox.svelte";
    import Button from "../../../primitives/Button/Button.svelte";

    let { filters, availableMethods = [], onchange, onreset }: Props = $props();

    const directionOptions: SelectOption[] = [
        { value: "all", label: "All directions" },
        { value: "inbound", label: "Inbound" },
        { value: "outbound", label: "Outbound" },
    ];

    function handleDirectionChange(value: string) {
        onchange?.({
            ...filters,
            direction: value as FilterState["direction"],
        });
    }

    function handleMethodToggle(method: string, checked: boolean) {
        const newMethods = checked
            ? [...filters.methods, method]
            : filters.methods.filter((m) => m !== method);
        onchange?.({
            ...filters,
            methods: newMethods,
        });
    }

    function handleErrorFilterChange(value: boolean | null) {
        onchange?.({
            ...filters,
            hasError: value,
        });
    }

    // Derive active filter count for badge
    const activeFilterCount = $derived(() => {
        let count = 0;
        if (filters.direction !== "all") count++;
        if (filters.methods.length > 0) count += filters.methods.length;
        if (filters.hasError !== null) count++;
        return count;
    });
</script>

<div class="ce-filter-panel">
    <div class="ce-filter-panel__header">
        <span class="ce-filter-panel__title">Filters</span>
        {#if activeFilterCount() > 0}
            <Button variant="ghost" size="sm" onclick={onreset}>
                Reset ({activeFilterCount()})
            </Button>
        {/if}
    </div>

    <div class="ce-filter-panel__section">
        <label class="ce-filter-panel__label">Direction</label>
        <Select
            value={filters.direction}
            options={directionOptions}
            onchange={handleDirectionChange}
            size="sm"
        />
    </div>

    {#if availableMethods.length > 0}
        <div class="ce-filter-panel__section">
            <label class="ce-filter-panel__label">Methods</label>
            <div class="ce-filter-panel__methods">
                {#each availableMethods as method}
                    <Checkbox
                        checked={filters.methods.includes(method)}
                        onchange={(checked) =>
                            handleMethodToggle(method, checked)}
                        label={method}
                    />
                {/each}
            </div>
        </div>
    {/if}

    <div class="ce-filter-panel__section">
        <label class="ce-filter-panel__label">Error Status</label>
        <div class="ce-filter-panel__error-options">
            <Checkbox
                checked={filters.hasError === null}
                onchange={() => handleErrorFilterChange(null)}
                label="All messages"
            />
            <Checkbox
                checked={filters.hasError === true}
                onchange={() => handleErrorFilterChange(true)}
                label="Errors only"
            />
            <Checkbox
                checked={filters.hasError === false}
                onchange={() => handleErrorFilterChange(false)}
                label="Hide errors"
            />
        </div>
    </div>
</div>

<style>
    .ce-filter-panel {
        display: flex;
        flex-direction: column;
        gap: var(--space-4);
        padding: var(--space-4);
        background: var(--color-bg-surface);
        border: 1px solid var(--color-border);
        border-radius: var(--radius-md);
    }

    .ce-filter-panel__header {
        display: flex;
        align-items: center;
        justify-content: space-between;
    }

    .ce-filter-panel__title {
        font-family: var(--font-ui);
        font-size: var(--text-sm);
        font-weight: var(--font-semibold);
        color: var(--color-text-primary);
    }

    .ce-filter-panel__section {
        display: flex;
        flex-direction: column;
        gap: var(--space-2);
    }

    .ce-filter-panel__label {
        font-family: var(--font-ui);
        font-size: var(--text-xs);
        font-weight: var(--font-medium);
        color: var(--color-text-secondary);
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }

    .ce-filter-panel__methods {
        display: flex;
        flex-direction: column;
        gap: var(--space-2);
    }

    .ce-filter-panel__error-options {
        display: flex;
        flex-direction: column;
        gap: var(--space-2);
    }
</style>
