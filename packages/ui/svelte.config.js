// Minimal svelte config for library mode
// vitePreprocess is configured in vite.config.ts instead

/** @type {import('svelte/compiler').CompileOptions} */
export default {
	// No preprocess here - handled by Vite config
	// This prevents the Svelte Language Server from triggering
	// rollup dependency errors in the IDE
};
