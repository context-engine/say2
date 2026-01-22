import { renderComponent, screen } from "../../../../tests/utils";
import { beforeEach, describe, expect, it, vi } from "bun:test";
import ToastContainer from "./ToastContainer.svelte";
import { toasts } from "./toast.store";

describe("Toast", () => {
	beforeEach(() => {
		// Clear any existing toasts
		toasts.subscribe((list) => {
			list.forEach((t) => toasts.removeToast(t.id));
		});
	});

	it("renders toast container", () => {
		renderComponent(ToastContainer, {});
		expect(
			screen.getByRole("region", { name: "Notifications" }),
		).toBeTruthy();
	});

	it("shows success toast", async () => {
		renderComponent(ToastContainer, {});
		toasts.success("Operation successful");

		// Wait for DOM update
		await new Promise((r) => setTimeout(r, 50));
		expect(screen.getByText("Operation successful")).toBeTruthy();
	});

	it("shows error toast", async () => {
		renderComponent(ToastContainer, {});
		toasts.error("Something went wrong");

		await new Promise((r) => setTimeout(r, 50));
		expect(screen.getByText("Something went wrong")).toBeTruthy();
	});

	it("shows warning toast", async () => {
		renderComponent(ToastContainer, {});
		toasts.warning("Please check your connection");

		await new Promise((r) => setTimeout(r, 50));
		expect(screen.getByText("Please check your connection")).toBeTruthy();
	});

	it("shows info toast", async () => {
		renderComponent(ToastContainer, {});
		toasts.info("New update available");

		await new Promise((r) => setTimeout(r, 50));
		expect(screen.getByText("New update available")).toBeTruthy();
	});

	it("displays correct class for success type", async () => {
		renderComponent(ToastContainer, {});
		toasts.success("Success");

		await new Promise((r) => setTimeout(r, 50));
		const toast = screen.getByText("Success").closest(".ce-toast");
		expect(toast?.classList.contains("ce-toast-success")).toBe(true);
	});

	it("has dismiss button", async () => {
		renderComponent(ToastContainer, {});
		toasts.success("Test message");

		await new Promise((r) => setTimeout(r, 50));
		expect(screen.getByRole("button", { name: "Dismiss" })).toBeTruthy();
	});
});
