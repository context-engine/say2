import { render, fireEvent } from "@testing-library/svelte";
import { describe, it, expect, vi } from "bun:test";
import JSONInspector from "./JSONInspector.svelte";

describe("JSONInspector", () => {
    it("renders simple object", () => {
        const { container, getByText } = render(JSONInspector, {
            data: { name: "test", count: 42 },
        });

        expect(getByText("name")).toBeTruthy();
        expect(getByText('"test"')).toBeTruthy();
        expect(getByText("42")).toBeTruthy();
    });

    it("renders array with items", () => {
        const { getByText } = render(JSONInspector, {
            data: { items: [1, 2, 3] },
            expandLevel: 2,
        });

        expect(getByText("items")).toBeTruthy();
        expect(getByText("3 items")).toBeTruthy();
    });

    it("syntax highlights by type", () => {
        const { container } = render(JSONInspector, {
            data: {
                str: "hello",
                num: 42,
                bool: true,
                nil: null,
            },
            expandLevel: 2,
        });

        expect(container.querySelector(".ce-json-value--string")).toBeTruthy();
        expect(container.querySelector(".ce-json-value--number")).toBeTruthy();
        expect(container.querySelector(".ce-json-value--boolean")).toBeTruthy();
        expect(container.querySelector(".ce-json-value--null")).toBeTruthy();
    });

    it("truncates at maxDepth", () => {
        const { getByText } = render(JSONInspector, {
            data: {
                l1: { l2: { l3: { l4: "deep" } } },
            },
            expandLevel: 10,
            maxDepth: 2,
        });

        expect(getByText("...")).toBeTruthy();
    });

    it("calls oncopypath when copy button clicked", async () => {
        const oncopypath = vi.fn();
        const { container } = render(JSONInspector, {
            data: { name: "test" },
            expandLevel: 2,
            oncopypath,
        });

        const copyButton = container.querySelector(".ce-json-copy-path");
        if (copyButton) {
            await fireEvent.click(copyButton);
            expect(oncopypath).toHaveBeenCalledWith("name");
        }
    });

    it("renders empty object/array correctly", () => {
        const { getByText } = render(JSONInspector, {
            data: { empty: {}, arr: [] },
            expandLevel: 2,
        });

        expect(getByText("{}")).toBeTruthy();
        expect(getByText("[]")).toBeTruthy();
    });
});
