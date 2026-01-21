import { render, fireEvent } from "@testing-library/svelte";
import { describe, it, expect, vi } from "bun:test";
import SearchBar from "./SearchBar.svelte";

describe("SearchBar", () => {
    const defaultProps = {
        query: "",
        resultCount: 0,
        currentIndex: 0,
    };

    it("renders search input", () => {
        const { getByRole } = render(SearchBar, defaultProps);

        expect(getByRole("search")).toBeTruthy();
        expect(getByRole("searchbox")).toBeTruthy();
    });

    it("calls onsearch when input changes", async () => {
        const onsearch = vi.fn();
        const { getByRole } = render(SearchBar, {
            ...defaultProps,
            onsearch,
        });

        const input = getByRole("searchbox");
        await fireEvent.input(input, { target: { value: "test" } });

        expect(onsearch).toHaveBeenCalledWith("test");
    });

    it("shows result count when query is present", () => {
        const { getByText } = render(SearchBar, {
            query: "test",
            resultCount: 5,
            currentIndex: 2,
        });

        expect(getByText("2 of 5")).toBeTruthy();
    });

    it("shows 'No results' when resultCount is 0", () => {
        const { getByText } = render(SearchBar, {
            query: "test",
            resultCount: 0,
            currentIndex: 0,
        });

        expect(getByText("No results")).toBeTruthy();
    });

    it("calls onnext when next button clicked", async () => {
        const onnext = vi.fn();
        const { getByLabelText } = render(SearchBar, {
            query: "test",
            resultCount: 5,
            currentIndex: 1,
            onnext,
        });

        await fireEvent.click(getByLabelText("Next match"));
        expect(onnext).toHaveBeenCalled();
    });

    it("calls onprev when prev button clicked", async () => {
        const onprev = vi.fn();
        const { getByLabelText } = render(SearchBar, {
            query: "test",
            resultCount: 5,
            currentIndex: 2,
            onprev,
        });

        await fireEvent.click(getByLabelText("Previous match"));
        expect(onprev).toHaveBeenCalled();
    });

    it("calls onclose when close button clicked", async () => {
        const onclose = vi.fn();
        const { getByLabelText } = render(SearchBar, {
            query: "test",
            resultCount: 5,
            currentIndex: 1,
            onclose,
        });

        await fireEvent.click(getByLabelText("Close search"));
        expect(onclose).toHaveBeenCalled();
    });

    it("disables nav buttons when no results", () => {
        const { getByLabelText } = render(SearchBar, {
            query: "test",
            resultCount: 0,
            currentIndex: 0,
        });

        expect(getByLabelText("Next match").hasAttribute("disabled")).toBe(true);
        expect(getByLabelText("Previous match").hasAttribute("disabled")).toBe(true);
    });
});
