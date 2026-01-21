import { render } from "@testing-library/svelte";
import { describe, it, expect } from "bun:test";
import SearchHighlight from "./SearchHighlight.svelte";

describe("SearchHighlight", () => {
    it("renders text without highlights when no match", () => {
        const { container } = render(SearchHighlight, {
            text: "Hello world",
            query: "foo",
        });

        expect(container.textContent).toBe("Hello world");
        expect(container.querySelector("mark")).toBeNull();
    });

    it("highlights single match", () => {
        const { container } = render(SearchHighlight, {
            text: "Hello world",
            query: "world",
        });

        const mark = container.querySelector("mark");
        expect(mark).toBeTruthy();
        expect(mark?.textContent).toBe("world");
        expect(container.textContent).toBe("Hello world");
    });

    it("highlights multiple matches", () => {
        const { container } = render(SearchHighlight, {
            text: "The fox and the fox",
            query: "fox",
        });

        const marks = container.querySelectorAll("mark");
        expect(marks.length).toBe(2);
        expect(marks[0].textContent).toBe("fox");
        expect(marks[1].textContent).toBe("fox");
    });

    it("case insensitive by default", () => {
        const { container } = render(SearchHighlight, {
            text: "Hello HELLO hello",
            query: "hello",
            caseSensitive: false,
        });

        const marks = container.querySelectorAll("mark");
        expect(marks.length).toBe(3);
    });

    it("respects case sensitive option", () => {
        const { container } = render(SearchHighlight, {
            text: "Hello HELLO hello",
            query: "hello",
            caseSensitive: true,
        });

        const marks = container.querySelectorAll("mark");
        expect(marks.length).toBe(1);
        expect(marks[0].textContent).toBe("hello");
    });

    it("escapes regex special characters in query", () => {
        const { container } = render(SearchHighlight, {
            text: "Search for (test) value",
            query: "(test)",
        });

        const mark = container.querySelector("mark");
        expect(mark).toBeTruthy();
        expect(mark?.textContent).toBe("(test)");
    });

    it("renders plain text when query is empty", () => {
        const { container } = render(SearchHighlight, {
            text: "Hello world",
            query: "",
        });

        expect(container.textContent).toBe("Hello world");
        expect(container.querySelector("mark")).toBeNull();
    });

    it("escapes brackets and other regex special chars", () => {
        const { container } = render(SearchHighlight, {
            text: "Match [test] and test+1",
            query: "[test]",
        });

        const mark = container.querySelector("mark");
        expect(mark).toBeTruthy();
        expect(mark?.textContent).toBe("[test]");
    });
});
