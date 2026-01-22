import { render } from "@testing-library/svelte";
import { describe, it, expect } from "bun:test";
import ConnectionStatus from "./ConnectionStatus.svelte";

describe("ConnectionStatus", () => {
    it("renders connected state", () => {
        const { getByText } = render(ConnectionStatus, { state: "connected" });
        expect(getByText("Connected")).toBeTruthy();
    });

    it("renders connecting state", () => {
        const { getByText } = render(ConnectionStatus, { state: "connecting" });
        expect(getByText("Connecting...")).toBeTruthy();
    });

    it("renders error state", () => {
        const { getByText } = render(ConnectionStatus, { state: "error" });
        expect(getByText("Connection Failed")).toBeTruthy();
    });

    it("renders compact mode without label", () => {
        const { container } = render(ConnectionStatus, {
            state: "connected",
            compact: true
        });
        const label = container.querySelector(".ce-connection-status__label");
        expect(label).toBeNull();
    });

    it("has correct accessibility role", () => {
        const { container } = render(ConnectionStatus, { state: "connected" });
        const status = container.querySelector("[role='status']");
        expect(status).toBeTruthy();
    });
});
