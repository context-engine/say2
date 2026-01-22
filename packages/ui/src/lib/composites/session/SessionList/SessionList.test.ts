import { fireEvent, render, screen } from "@testing-library/svelte";
import { describe, expect, it, vi } from "bun:test";
import SessionList from "./SessionList.svelte";
import type { Session } from "../SessionCard/SessionCard.svelte";

const mockSessions: Session[] = [
    {
        id: "1",
        name: "Echo Server",
        status: "active",
        messageCount: 42,
        createdAt: new Date(),
        serverCommand: "npx echo"
    },
    {
        id: "2",
        name: "Memory Server",
        status: "connected",
        messageCount: 12,
        createdAt: new Date(),
        serverCommand: "npx memory"
    }
];

describe("SessionList", () => {
    it("renders title and session items", () => {
        render(SessionList, { sessions: mockSessions });
        expect(screen.getByText("Sessions")).toBeTruthy();
        expect(screen.getByText("Echo Server")).toBeTruthy();
        expect(screen.getByText("Memory Server")).toBeTruthy();
    });

    it("filters sessions based on search query", () => {
        const { component } = render(SessionList, {
            sessions: mockSessions,
            searchQuery: "Echo"
        });

        expect(screen.getByText("Echo Server")).toBeTruthy();
        expect(screen.queryByText("Memory Server")).toBeNull();
    });

    it("calls onSelect when a session card is clicked", async () => {
        const onSelect = vi.fn();
        render(SessionList, { sessions: mockSessions, onSelect });

        const card = screen.getByText("Echo Server");
        await fireEvent.click(card);

        expect(onSelect).toHaveBeenCalledWith("1");
    });

    it("calls onAddSession when add button is clicked", async () => {
        const onAddSession = vi.fn();
        render(SessionList, { sessions: mockSessions, onAddSession });

        const addButton = screen.getByLabelText("Add Session");
        await fireEvent.click(addButton);

        expect(onAddSession).toHaveBeenCalled();
    });

    it("shows empty state when no sessions match search", () => {
        render(SessionList, {
            sessions: mockSessions,
            searchQuery: "NonExistent"
        });

        expect(screen.getByText("No results found")).toBeTruthy();
        expect(screen.getByText('No sessions matching "NonExistent"')).toBeTruthy();
    });

    it("shows basic empty state when sessions array is empty", () => {
        render(SessionList, { sessions: [] });

        expect(screen.getByText("No sessions yet")).toBeTruthy();
    });
});
