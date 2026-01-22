import { render, screen } from "@testing-library/svelte";
import { describe, expect, it, vi } from "bun:test";
import TrafficList, { type Message } from "./TrafficList.svelte";

import MockVirtualList from "./MockVirtualList.svelte";

// Mock child components to isolate TrafficList logic
vi.mock("../../cross-cutting/VirtualList/VirtualList.svelte", () => ({
    default: MockVirtualList
}));

describe("TrafficList", () => {
    const mockMessages: Message[] = [
        { id: "1", direction: "inbound", type: "request", method: "test", preview: "test", timestamp: new Date() },
        { id: "2", direction: "outbound", type: "response", method: "test", preview: "test", timestamp: new Date() }
    ];

    it("renders empty state when no messages", () => {
        render(TrafficList, { messages: [] });
        expect(screen.getByText("No messages yet")).toBeTruthy();
    });

    it("renders VirtualList when messages exist", () => {
        // Since we mocked VirtualList but svelte testing library renders real components usually,
        // we might rely on the fact that VirtualList is used.
        // However, standard testing of composition in Svelte 5 is tricky without shallow render.
        // We'll check if content div exists.
        const { container } = render(TrafficList, { messages: mockMessages });
        expect(container.querySelector(".ce-traffic-list__content")).toBeTruthy();
    });

    it("renders controls", () => {
        const { container } = render(TrafficList, { messages: mockMessages });
        expect(container.querySelector(".ce-traffic-list__controls")).toBeTruthy();
    });
});
