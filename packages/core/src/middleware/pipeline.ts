/**
 * Middleware Pipeline
 *
 * Middleware chain using koa-compose for production-tested composition.
 */

import compose from "koa-compose";
import type {
	ContextKey,
	MessageEvent,
	Middleware,
	MiddlewareContext,
	Session,
} from "../types";

/**
 * Concrete implementation of MiddlewareContext.
 */
export class Context implements MiddlewareContext {
	public readonly event: MessageEvent;
	public readonly session: Session;
	private extensions: Map<symbol, unknown> = new Map();

	constructor(event: MessageEvent, session: Session) {
		this.event = event;
		this.session = session;
	}

	get<T>(key: ContextKey<T>): T | undefined {
		const value = this.extensions.get(key.id);
		if (value === undefined) {
			return key.defaultValue;
		}
		return value as T;
	}

	set<T>(key: ContextKey<T>, value: T): void {
		this.extensions.set(key.id, value);
	}
}

/**
 * MiddlewarePipeline manages and executes a chain of middlewares.
 */
export class MiddlewarePipeline {
	private middlewares: Middleware[] = [];
	private composedFn: ((ctx: MiddlewareContext) => Promise<void>) | null = null;

	/**
	 * Add a middleware to the pipeline.
	 */
	use(middleware: Middleware): this {
		this.middlewares.push(middleware);
		this.composedFn = null; // Invalidate cache
		return this;
	}

	/**
	 * Execute all middlewares in order.
	 */
	async run(ctx: MiddlewareContext): Promise<void> {
		if (!this.composedFn) {
			this.composedFn = compose(this.middlewares);
		}
		await this.composedFn(ctx);
	}

	/**
	 * Create a context and run the pipeline.
	 */
	async process(event: MessageEvent, session: Session): Promise<void> {
		const ctx = new Context(event, session);
		await this.run(ctx);
	}

	/**
	 * Get the number of middlewares.
	 */
	get length(): number {
		return this.middlewares.length;
	}

	/**
	 * Clear all middlewares.
	 */
	clear(): void {
		this.middlewares = [];
		this.composedFn = null;
	}
}

/**
 * Create a new MiddlewarePipeline instance.
 */
export function createPipeline(): MiddlewarePipeline {
	return new MiddlewarePipeline();
}
