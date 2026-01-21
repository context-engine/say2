import { render, fireEvent } from "@testing-library/svelte";
import { describe, it, expect, jest } from "bun:test";
import ToolCard from "./ToolCard.svelte";

describe("ToolCard", () => {
    const mockTool = {
        name: "test_tool",
        description: "A test tool description",
        annotations: {
            destructiveHint: true,
            readOnlyHint: true
        }
    };

    it("renders tool name and description", () => {
        const { getByText } = render(ToolCard, { tool: mockTool });

        expect(getByText("test_tool")).toBeTruthy();
        expect(getByText("A test tool description")).toBeTruthy();
    });

    it("renders annotation badges", () => {
        const { getByText } = render(ToolCard, { tool: mockTool });

        expect(getByText("destructive")).toBeTruthy();
        expect(getByText("read-only")).toBeTruthy();
    });

    it("triggers onclick when clicked", async () => {
        const onclick = jest.fn();
        const { getByRole } = render(ToolCard, {
            tool: mockTool,
            onclick
        });

        const button = getByRole("button");
        await fireEvent.click(button);

        expect(onclick).toHaveBeenCalled();
    });

    it("handles missing description and annotations", () => {
        const minimalTool = { name: "minimal" };
        const { getByText, queryByText } = render(ToolCard, { tool: minimalTool });

        expect(getByText("minimal")).toBeTruthy();
        expect(queryByText("destructive")).toBeNull();
    });
});
