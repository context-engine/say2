import { type Writable, writable } from "svelte/store";

export interface Toast {
	id: string;
	message: string;
	type: "info" | "success" | "warning" | "error";
	duration?: number;
	dismissable?: boolean;
}

interface ToastStore {
	toasts: Toast[];
	addToast: (toast: Omit<Toast, "id">) => string;
	removeToast: (id: string) => void;
	success: (message: string) => string;
	error: (message: string) => string;
	warning: (message: string) => string;
	info: (message: string) => string;
}

function createToastStore(): ToastStore {
	const { subscribe, update } = writable<Toast[]>([]);

	const generateId = () => Math.random().toString(36).slice(2, 9);

	const removeToast = (id: string) => {
		update((toasts) => toasts.filter((t) => t.id !== id));
	};

	const addToast = (toast: Omit<Toast, "id">): string => {
		const id = generateId();
		const newToast: Toast = {
			...toast,
			id,
			duration: toast.duration ?? 3000,
			dismissable: toast.dismissable ?? true,
		};

		update((toasts) => [...toasts, newToast]);

		if (newToast.duration && newToast.duration > 0) {
			setTimeout(() => removeToast(id), newToast.duration);
		}

		return id;
	};

	return {
		subscribe,
		addToast,
		removeToast,
		success: (message: string) => addToast({ message, type: "success" }),
		error: (message: string) => addToast({ message, type: "error" }),
		warning: (message: string) => addToast({ message, type: "warning" }),
		info: (message: string) => addToast({ message, type: "info" }),
	};
}

export const toasts: Writable<Toast[]> & Omit<ToastStore, "toasts"> =
	createToastStore() as any;

toasts.subscribe = ((set: (value: Toast[]) => void) => {
	const store = createToastStore();
	return store.subscribe;
})();
