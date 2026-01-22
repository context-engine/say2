<script lang="ts">
    import SearchBar from "./SearchBar.svelte";

    interface Props {
        initialQuery?: string;
    }

    let { initialQuery = "" }: Props = $props();

    let query = $state(initialQuery);
    let resultCount = $state(0);
    let currentIndex = $state(0);

    // Simulate search results
    function handleSearch(q: string) {
        query = q;
        if (q) {
            // Simulate finding results
            resultCount = Math.floor(Math.random() * 10) + 1;
            currentIndex = resultCount > 0 ? 1 : 0;
        } else {
            resultCount = 0;
            currentIndex = 0;
        }
    }

    function handleNext() {
        if (currentIndex < resultCount) {
            currentIndex++;
        } else {
            currentIndex = 1; // Wrap around
        }
    }

    function handlePrev() {
        if (currentIndex > 1) {
            currentIndex--;
        } else {
            currentIndex = resultCount; // Wrap around
        }
    }

    function handleClose() {
        query = "";
        resultCount = 0;
        currentIndex = 0;
    }
</script>

<div style="padding: 1rem; max-width: 400px;">
    <SearchBar
        {query}
        {resultCount}
        {currentIndex}
        onsearch={handleSearch}
        onnext={handleNext}
        onprev={handlePrev}
        onclose={handleClose}
    />

    <div
        style="margin-top: 1rem; padding: 1rem; background: var(--color-bg-secondary); border-radius: var(--radius-sm); font-family: var(--font-mono); font-size: var(--text-xs);"
    >
        <strong>State:</strong> query="{query}", results={resultCount}, current={currentIndex}
    </div>
</div>
