import { mock } from "bun:test";
import { GlobalRegistrator } from "@happy-dom/global-registrator";

const svelteEntry = Bun.resolveSync("svelte", import.meta.dir);
const clientEntry = svelteEntry.replace("index-server.js", "index-client.js");
const client = await import(clientEntry);
mock.module("svelte", () => client);

// Register happy-dom globally for DOM APIs
GlobalRegistrator.register();
