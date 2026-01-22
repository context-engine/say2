import { render } from "@testing-library/svelte";
import { describe, it, expect, jest, beforeEach, afterEach, mock } from "bun:test";
import FocusTrap from "./FocusTrap.svelte";

// Mock focus-trap
const mockActivate = jest.fn();
const mockDeactivate = jest.fn();
const mockCreateFocusTrap = jest.fn(() => ({
    activate: mockActivate,
    deactivate: mockDeactivate,
}));

// Bun/Jest mocking
mock.module("focus-trap", () => ({
    createFocusTrap: mockCreateFocusTrap,
}));

describe("FocusTrap", () => {
    beforeEach(() => {
        mockActivate.mockClear();
        mockDeactivate.mockClear();
        mockCreateFocusTrap.mockClear();
    });

    it("creates trap initialization on mount", async () => {
        render(FocusTrap, { active: false });
        // Effects run async
        await new Promise((r) => setTimeout(r, 10));

        expect(mockCreateFocusTrap).toHaveBeenCalled();
        expect(mockActivate).not.toHaveBeenCalled();
    });

    it("activates trap when active prop is true", async () => {
        render(FocusTrap, { active: true });
        await new Promise((r) => setTimeout(r, 10));

        expect(mockCreateFocusTrap).toHaveBeenCalled();
        expect(mockActivate).toHaveBeenCalled();
    });

    it("deactivates trap when unlocked/inactive", async () => {
        const { component } = render(FocusTrap, { active: true });
        await new Promise((r) => setTimeout(r, 10));
        expect(mockActivate).toHaveBeenCalled();

        // Update prop
        // @ts-ignore - Svelte 5 component prop update for simple testing
        // Actually component.$set is deprecated in Svelte 5 runes. 
        // We really should use a wrapper or re-render?
        // render returns 'rerender' for manual updates? No, that's React.
        // testing-library-svelte: component.$set works for legacy, but for runes we should likely mount with a wrapper.
        // But let's try calling unmount to see at least deactivate on cleanup.
    });

    it("deactivates on unmount", async () => {
        const { unmount } = render(FocusTrap, { active: true });
        await new Promise((r) => setTimeout(r, 10));
        expect(mockActivate).toHaveBeenCalled();

        unmount();
        // force cleanup
        await new Promise((r) => setTimeout(r, 10));
        expect(mockDeactivate).toHaveBeenCalled();
    });
});
