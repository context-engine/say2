import { render, screen, waitFor } from "@testing-library/svelte";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ToastContainer from "./ToastContainer.svelte";
import { toasts } from "./toast.store";

describe("Toast", () => {
	beforeEach(() => {
		toasts.removeToast = ((id: string) => {
			toasts.subscribe((t) => t.filter((x) => x.id !== id));
		}) as any;
	});

	it("renders toast container", () => {
		render(ToastContainer);
		expect(
			screen.getByRole("region", { name: "Notifications" }),
		).toBeInTheDocument();
	});

	it("shows success toast", async () => {
		render(ToastContainer);
		toasts.success("Operation successful");

		await waitFor(() => {
			expect(screen.getByText("Operation successful")).toBeInTheDocument();
		});
	});

	it("shows error toast", async () => {
		render(ToastContainer);
		toasts.error("Something went wrong");

		await waitFor(() => {
			expect(screen.getByText("Something went wrong")).toBeInTheDocument();
		});
	});

	it("shows warning toast", async () => {
		render(ToastContainer);
		toasts.warning("Please check your connection");

		await waitFor(() => {
			expect(
				screen.getByText("Please check your connection"),
			).toBeInTheDocument();
		});
	});

	it("shows info toast", async () => {
		render(ToastContainer);
		toasts.info("New update available");

		await waitFor(() => {
			expect(screen.getByText("New update available")).toBeInTheDocument();
		});
	});

	it("displays correct icon for each type", async () => {
		render(ToastContainer);
		toasts.success("Success");

		await waitFor(() => {
			const toast = screen.getByText("Success").closest(".toast");
			expect(toast).toHaveClass("toast-success");
		});
	});

	it("has dismiss button", async () => {
		render(ToastContainer);
		toasts.success("Test message");

		await waitFor(() => {
			expect(
				screen.getByRole("button", { name: "Dismiss" }),
			).toBeInTheDocument();
		});
	});
});
