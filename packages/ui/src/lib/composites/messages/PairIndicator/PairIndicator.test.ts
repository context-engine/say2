import { render } from "@testing-library/svelte";
import { describe, it, expect } from "bun:test";
import PairIndicator from "./PairIndicator.svelte";

describe("PairIndicator", () => {
    it("renders paired state", () => {
        const { container } = render(PairIndicator, { paired: true });
        const paired = container.querySelector(".ce-pair-indicator--paired");
        expect(paired).toBeTruthy();
    });

    it("renders unpaired state", () => {
        const { container } = render(PairIndicator, { paired: false });
        const unpaired = container.querySelector(".ce-pair-indicator--unpaired");
        expect(unpaired).toBeTruthy();
    });

    it("renders pending spinner", () => {
        const { container } = render(PairIndicator, { pending: true });
        const spinner = container.querySelector(".ce-spinner");
        expect(spinner).toBeTruthy();
    });
});
