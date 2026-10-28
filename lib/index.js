/**
 * Host shell for the polish plugin.
 *
 * The real host implementation lives in `./host.js` and is loaded through a
 * cache-busting URL; this file watches it and swaps the implementation when the
 * file changes. The point is development speed: DSH keeps Node's ESM cache, so a
 * plugin loaded normally keeps running its first version until the whole host
 * process restarts. Here the shell — which never changes — stays in the cache and
 * the child plugin is disposed and re-created from the freshly loaded module.
 *
 * Nothing about the wire contract changes: `name` and `inject` stay on the
 * shell so the loader's row is identical, and the child runs under its own
 * name so cordis does not confuse the two.
 *
 * Reload failures are contained: the previous child keeps serving until a new
 * implementation loads, and a syntax error is reported instead of unmounting the
 * plugin.
 *
 * @module hdy-plugin
 */
import { watch } from "node:fs";
import { stat } from "node:fs/promises";
import { fileURLToPath } from "node:url";

/** Cordis function-plugin name (unchanged, so the profile row is unchanged). */
const name = "hdy-plugin";

/** Services the child implementation expects. */
const inject = ["webServer", "connection", "llm", "agentDefaultModel"];

/** Absolute location of the implementation this shell reloads. */
const HOST_URL = new URL("./host.js", import.meta.url);
const HOST_PATH = fileURLToPath(HOST_URL);

/** Marks the first mount attempt, so callers can await a usable plugin. */
let markReady;
/** Resolves after the first implementation mount attempt (success or not). */
export const ready = new Promise((resolve) => {
	markReady = resolve;
});

/**
 * Load the implementation, then mount it as a child plugin.
 * @param ctx - the plugin context.
 * @param config - the row's configuration.
 */
function apply(ctx, config) {
	/** Current child fiber; undefined before the first successful mount. */
	let fiber;
	/** Mount counter: a stale load must not replace a newer one. */
	let generation = 0;
	let closed = false;
	let timer;
	/** Serialized loads; a burst of writes collapses into the last one. */
	let queue = Promise.resolve();

	const load = async () => {
		const token = (generation += 1);
		let info;
		try {
			info = await stat(HOST_PATH);
		} catch {
			return;
		}
		let mod;
		try {
			mod = await import(`${HOST_URL.href}?v=${info.mtimeMs}-${token}`);
		} catch (error) {
			/* Keep the previous implementation mounted; a half-written file must not
			 * take the button away. */
			ctx.logger?.error?.("hdy-plugin: host reload failed", error);
			console.error("hdy-plugin: host reload failed", error);
			return;
		}
		if (closed || token !== generation) return;
		if (typeof mod.apply !== "function") {
			markReady(false);
			return;
		}
		if (fiber !== void 0) {
			const previous = fiber;
			fiber = void 0;
			await previous.dispose();
			if (closed) return;
		}
		/* Tests and any host without cordis get the implementation directly. */
		if (typeof ctx.plugin !== "function") {
			mod.apply(ctx, config ?? {});
			markReady(true);
			return;
		}
		fiber = ctx.plugin({
			name: "hdy-plugin-host",
			inject: mod.inject ?? inject,
			apply: mod.apply
		}, config ?? {});
		markReady(true);
	};

	const reload = () => {
		queue = queue.then(load, load);
	};

	reload();

	ctx.effect(() => {
		let watcher;
		try {
			watcher = watch(HOST_PATH, { persistent: false }, () => {
				clearTimeout(timer);
				timer = setTimeout(reload, 120);
			});
			watcher.on("error", () => {});
		} catch {
			/* A platform without fs.watch simply gets no live reload. */
		}
		return () => {
			closed = true;
			clearTimeout(timer);
			watcher?.close();
			const current = fiber;
			fiber = void 0;
			return current === void 0 ? void 0 : current.dispose();
		};
	}, "hdy-plugin: host shell watch");
}

export { apply, inject, name };
