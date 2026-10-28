/**
 * Host half of the prompt-polish plugin.
 *
 * Serves one streaming route that the composer button
 * (`@deepseek-ai/dsh-client-ui-prompt-polish/client`) posts to. The route owns
 * the model call: the browser holds no credential and never talks to a provider.
 *
 * The reply is newline-delimited JSON events rather than a bare body, so the
 * panel can render tokens as they arrive — the visible half of what makes
 * prompt-optimizer feel live — and so a failure mid-generation is reportable
 * instead of looking like a truncated prompt.
 *
 * Security has one home: every request passes the composition's `connection`
 * trust fence (Host/Origin plus the browser session cookie) before any model
 * call is spent.
 *
 * @module @benrong/dsh-prompt-polish
 */
import { randomUUID } from "node:crypto";

/**
 * Revision carried by the shell's cache-busting URL (`host.js?v=…`). Passing
 * the same query to the local imports makes an edit to any host module reload
 * the whole implementation, not just this file; a plain import has no query,
 * so tests and direct consumers load the normal, cached graph.
 */
const REVISION = new URL(import.meta.url).search;
const { OPTIMIZATION_MODES, extractPrompt, getDefaultTemplateId, getTemplate, templateVariables, TEMPLATES } = await import(`./prompts.js${REVISION}`);
const { buildMessages, createTemplateContext, isSimpleTemplate } = await import(`./processor.js${REVISION}`);
const { applyVariables, parseExtractionResult } = await import(`./extraction.js${REVISION}`);

/** Bumped by hand while developing, to see the shell pick up a new build. */
const HOST_STAMP = "0.2.5-hdy.1";

/** Ceilings for the forked session snapshot folded into one polish request. */
const MAX_HISTORY_MESSAGES = 12;
const MAX_HISTORY_CHARS = 12_000;

/** Flatten one session message's content blocks to plain text. */
function contentToText(content) {
	if (typeof content === "string") return content;
	if (!Array.isArray(content)) return "";
	const parts = [];
	for (const block of content) {
		if (block !== null && typeof block === "object" && typeof block.text === "string") parts.push(block.text);
	}
	return parts.join("");
}

/**
 * Snapshot the conversation the polish is happening in.
 *
 * This is a fork in the read-only sense: the session's derived history is
 * copied out, trimmed, and handed to the model as context. Nothing is written
 * back, so polishing never mutates the live thread or its version chain.
 * @param ctx - plugin context carrying the host session store.
 * @param sessionId - id supplied by the composer.
 * @returns the recent user/assistant turns, oldest first.
 */
async function readForkedHistory(ctx, sessionId) {
	if (typeof sessionId !== "string") return { turns: [], reason: "no-session-id" };
	const get = typeof ctx.get === "function" ? (name) => ctx.get(name) : (name) => ctx[name];
	/**
	 * A live session is the common case; a session this process has not opened
	 * (another window's thread, or a just-restarted host) is read back through
	 * the query service, which loads the persisted log without attaching it.
	 */
	let session;
	const sessions = get("sessions");
	if (sessions !== void 0 && typeof sessions.get === "function") {
		try {
			session = sessions.get(sessionId);
		} catch {
			session = void 0;
		}
	}
	if (session === void 0) {
		const query = get("sessionQuery");
		if (query === void 0 || typeof query.readSession !== "function") return { turns: [], reason: "no-query-service" };
		try {
			session = await query.readSession(sessionId);
		} catch {
			return { turns: [], reason: "query-failed" };
		}
	}
	if (session === void 0 || typeof session.deriveMessages !== "function") return { turns: [], reason: "session-not-found" };
	let derived;
	try {
		derived = session.deriveMessages();
	} catch {
		return { turns: [], reason: "derive-failed" };
	}
	const turns = [];
	for (const message of derived) {
		if (message.role !== "user" && message.role !== "assistant") continue;
		const text = contentToText(message.content);
		if (text === "") continue;
		turns.push({ role: message.role, content: text });
	}
	const kept = [];
	let used = 0;
	for (let index = turns.length - 1; index >= 0; index -= 1) {
		const turn = turns[index];
		if (kept.length >= MAX_HISTORY_MESSAGES || used + turn.content.length > MAX_HISTORY_CHARS) break;
		kept.unshift(turn);
		used += turn.content.length;
	}
	return { turns: kept, reason: kept.length === 0 ? "empty-session" : void 0 };
}

/** The three `OptimizationMode` ids the wire accepts. */
const MODE_IDS = new Set(OPTIMIZATION_MODES.map((mode) => mode.id));

/** Cordis function-plugin name. */
const name = "hdy-plugin";

/** The route carrier, the trust fence, the model runtime, and the default route. */
const inject = ["webServer", "connection", "llm", "agentDefaultModel"];

/** POST route answering one optimization request as an NDJSON event stream. */
const OPTIMIZE_ROUTE = "/prompt-polish/optimize";

/**
 * GET route listing selectable models.
 *
 * The composer's current model is only a sane default: a user may have it on an
 * image model, which cannot answer a text rewrite at all. The panel needs its
 * own choice, and the browser cannot enumerate models by itself.
 */
const MODELS_ROUTE = "/prompt-polish/models";

/**
 * Variable extraction: its own model call, because upstream treats it as one —
 * `VariableExtractionService` is a separate service with its own template, its
 * own response schema, and its own error types. It is not a mode of the
 * optimizer and does not stream.
 */
const EXTRACT_ROUTE = "/prompt-polish/extract-variables";

/** Drafts plus a revision note are small; anything larger is hostile or a bug. */
const MAX_BODY_BYTES = 1024 * 1024;

/** Per-field ceiling. The body cap is the transport limit; this is the sane one. */
const MAX_FIELD_CHARS = 60_000;

/**
 * Output ceiling. This must cover the model's reasoning tokens *and* the
 * rewritten prompt: a reasoning model that spends the budget thinking emits no
 * answer at all, which the browser would see as an empty result.
 */
const MAX_TOKENS = 16384;

/**
 * Resolve the model route for one call.
 *
 * The profile's agent default model is the source of truth, which is what makes
 * the button follow whatever the user last picked in Settings without the
 * browser having to say so. A composition without that service falls back to
 * nothing and the caller answers 503 rather than guessing a provider.
 * @param ctx - the plugin context.
 * @returns the provider/model pair, or undefined when none is configured.
 */
function resolveRoute(ctx) {
	const defaults = ctx.agentDefaultModel ?? (ctx.get === void 0 ? void 0 : ctx.get("agentDefaultModel"));
	if (defaults === void 0 || typeof defaults.currentSelection !== "function") return void 0;
	const selection = defaults.currentSelection();
	if (selection === void 0 || typeof selection.provider !== "string" || typeof selection.model !== "string") return void 0;
	return selection;
}

/** JSON response (no-store: every answer is a fresh model generation). */
function sendJson(res, status, payload) {
	res.statusCode = status;
	res.setHeader("content-type", "application/json; charset=utf-8");
	res.setHeader("cache-control", "no-store");
	res.end(JSON.stringify(payload));
}

/** 405 with the route's one supported method. */
function sendMethodNotAllowed(res, allow) {
	res.statusCode = 405;
	res.setHeader("allow", allow);
	res.end();
}

/** Collect a bounded request body as UTF-8 text; null past the ceiling. */
async function readBoundedBody(req) {
	const chunks = [];
	let size = 0;
	for await (const chunk of req) {
		size += chunk.byteLength;
		if (size > MAX_BODY_BYTES) {
			req.resume();
			return null;
		}
		chunks.push(chunk);
	}
	return Buffer.concat(chunks, size).toString("utf8");
}

/**
 * Validate the wire body at the boundary.
 * @param text - raw JSON text.
 * @returns the parsed request, or null when malformed.
 */
/** Cap on history messages and tool definitions folded into one request. */
const MAX_CONTEXT_MESSAGES = 50;
const MAX_CONTEXT_CHARS = 200_000;

/**
 * Validate a request and resolve it to `{ template, context, route }`.
 *
 * The field names mirror upstream's `OptimizationRequest`
 * (`optimizationMode`, `targetPrompt`, `templateId`, `contextMode`,
 * `advancedContext`) on purpose: the wire is then the same object the ported
 * processor consumes, so there is no translation layer to drift from upstream.
 *
 * `templateId` is optional exactly as it is upstream — when absent the family
 * default is resolved through the fallback chain. When present it must agree
 * with `optimizationMode`, because a client that mixes the two would otherwise
 * get a system-family answer for a user-family question and never notice.
 */
function parseBody(text) {
	let body;
	try {
		body = JSON.parse(text);
	} catch {
		return null;
	}
	if (typeof body !== "object" || body === null) return null;
	if (Array.isArray(body)) return null;
	const { optimizationMode, targetPrompt, templateId, lastOptimizedPrompt, iterateInput, contextMode, advancedContext, inputImages, provider, model, sessionId, forkContext, reasoningEffort } = body;
	if (typeof optimizationMode !== "string" || !MODE_IDS.has(optimizationMode)) return null;
	if (typeof targetPrompt !== "string" || targetPrompt.trim() === "" || targetPrompt.length > MAX_FIELD_CHARS) return null;
	if (contextMode !== void 0 && contextMode !== "system" && contextMode !== "user") return null;
	/**
	 * Session identity for the context fork. Optional: a client that cannot see
	 * its session keeps working, just without the snapshot.
	 */
	if (sessionId !== void 0 && (typeof sessionId !== "string" || !/^[A-Za-z0-9_.:\-]{1,160}$/.test(sessionId))) return null;
	if (forkContext !== void 0 && typeof forkContext !== "boolean") return null;
	/**
	 * Images are a separate carrier upstream hands to a vision model in one
	 * call. Until this plugin can reach attachment bytes, accepting them and
	 * quietly dropping them would be worse than refusing.
	 */
	if (Array.isArray(inputImages) && inputImages.length > 0) return { unsupported: "inputImages" };
	if (optimizationMode === "iterate") {
		if (typeof lastOptimizedPrompt !== "string" || lastOptimizedPrompt.trim() === "") return null;
		if (typeof iterateInput !== "string" || iterateInput.trim() === "") return null;
		if (lastOptimizedPrompt.length > MAX_FIELD_CHARS || iterateInput.length > MAX_FIELD_CHARS) return null;
	}
	const family = optimizationMode === "user" ? "userOptimize" : optimizationMode === "iterate" ? "iterate" : "optimize";
	let template;
	if (templateId === void 0) {
		template = getTemplate(getDefaultTemplateId(family));
	} else {
		if (typeof templateId !== "string") return null;
		template = getTemplate(templateId);
		if (template === void 0) return null;
		if (template.optimizationMode !== optimizationMode) return { unsupported: "mode-template-mismatch" };
	}
	/**
	 * Validate the optional context bags BEFORE handing them to the processor:
	 * `createExtendedContext` distinguishes "absent" (`undefined`) from "present
	 * but empty" and would call `Object.entries(null)` on a null here, which
	 * throws instead of answering 400.
	 */
	const variables = parseVariables(advancedContext);
	const messages = parseMessages(advancedContext);
	const tools = parseTools(advancedContext);
	if (variables === null || messages === null || tools === null) return null;
	const context = createTemplateContext({
		optimizationMode,
		targetPrompt,
		contextMode,
		lastOptimizedPrompt,
		iterateInput,
		variables,
		messages,
		tools
	});
	/**
	 * An optional pinned route. Both halves must be present: a model id without
	 * its provider would silently be tried against the composer's provider,
	 * which is a worse failure than falling back to the current selection.
	 */
	if (provider !== void 0 && model !== void 0) {
		if (typeof provider !== "string" || typeof model !== "string") return null;
		if (provider.length > 200 || model.length > 200) return null;
	}
	/** Reasoning effort travels as the adapter's own id; the model decides validity. */
	if (reasoningEffort !== void 0 && (typeof reasoningEffort !== "string" || reasoningEffort === "" || reasoningEffort.length > 64)) return null;
	return {
		template,
		context,
		optimizationMode,
		sessionId,
		forkContext: forkContext !== false,
		reasoningEffort,
		route: provider !== void 0 && model !== void 0 ? {
			provider,
			model
		} : void 0
	};
}

/** @returns `advancedContext.variables`, or null when malformed. */
function parseVariables(advancedContext) {
	if (advancedContext === void 0 || advancedContext === null) return void 0;
	if (typeof advancedContext !== "object") return null;
	const source = advancedContext.variables;
	if (source === void 0) return void 0;
	if (typeof source !== "object" || source === null || Array.isArray(source)) return null;
	const out = {};
	for (const [key, value] of Object.entries(source)) {
		if (typeof value !== "string" || value.length > MAX_FIELD_CHARS) return null;
		out[key] = value;
	}
	return out;
}

/** @returns `advancedContext.messages`, or null when malformed. */
function parseMessages(advancedContext) {
	if (advancedContext === void 0 || advancedContext === null) return void 0;
	const source = advancedContext.messages;
	if (source === void 0) return void 0;
	if (!Array.isArray(source) || source.length > MAX_CONTEXT_MESSAGES) return null;
	let total = 0;
	for (const message of source) {
		if (typeof message !== "object" || message === null) return null;
		if (typeof message.role !== "string" || typeof message.content !== "string") return null;
		total += message.content.length;
	}
	if (total > MAX_CONTEXT_CHARS) return null;
	return source.map((message) => ({ role: message.role, content: message.content }));
}

/** @returns `advancedContext.tools`, or null when malformed. */
function parseTools(advancedContext) {
	if (advancedContext === void 0 || advancedContext === null) return void 0;
	const source = advancedContext.tools;
	if (source === void 0) return void 0;
	if (!Array.isArray(source) || source.length > MAX_CONTEXT_MESSAGES) return null;
	for (const tool of source) {
		/**
		 * `formatToolsAsText` interpolates the name unguarded, so an empty one would
		 * render as `Tool name: ` and hand the model a blank identity to reason about.
		 */
		if (typeof tool !== "object" || tool === null) return null;
		if (typeof tool.function?.name !== "string" || tool.function.name.trim() === "") return null;
	}
	return JSON.parse(JSON.stringify(source));
}

/** Deep-freeze one value in place and hand it back (the message creation contract). */
function deepFreeze(value) {
	if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
		Object.freeze(value);
		for (const nested of Object.values(value)) deepFreeze(nested);
	}
	return value;
}

/**
 * Build one chat message by hand.
 *
 * `@deepseek-ai/dsh-llm` is not imported here on purpose: this package lives
 * under the profile's own `node_modules`, while the DSH packages live inside a
 * read-only `app.asar`, so a bare import of a DSH package has no resolution
 * root from this file and would fail activation. The message contract is data
 * — `role`, `content` blocks, and a `source` tag whose `form` is optional — so
 * the literal below satisfies it without reaching for the helper. `content`
 * must be a BLOCK ARRAY: the adapter's `flattenText` calls
 * `message.content.filter(...)`, so a bare string throws there.
 * @param role - `"system"` or `"user"`.
 * @param text - the rendered message text.
 * @returns a frozen message carrying this plugin's source tag.
 */
function pluginMessage(role, text) {
	return deepFreeze({
		id: "prompt-polish-" + randomUUID(),
		role,
		content: [{
			type: "text",
			text
		}],
		source: {
			kind: "plugin",
			plugin: name
		}
	});
}

/** Render a chunk-type histogram as `text-delta×12 finish×1`. */
function summarize(seen) {
	return [ ...seen ].map(([type, count]) => `${type}×${count}`).join(" ");
}

/**
 * Run one completion to the end without streaming it to a caller.
 *
 * Extraction wants the whole document before it can be parsed, so it has no use
 * for the delta pump the optimize route runs. Same fence rules apply: the
 * persona stays a leading `system` message and `options.system` is left unset.
 * @param ctx - the plugin context.
 * @param route - `{ provider, model }`.
 * @param messages - already-built `{ role, content }` list.
 * @returns the assembled text plus the terminal reason.
 */
async function collectCompletion(ctx, route, messages) {
	let assembled = "";
	let terminal;
	const seen = new Map();
	for await (const chunk of ctx.llm.stream({
		provider: route.provider,
		model: route.model,
		messages,
		maxTokens: MAX_TOKENS
	})) {
		seen.set(chunk.type, (seen.get(chunk.type) ?? 0) + 1);
		if (chunk.type === "text-delta") assembled += chunk.text;
		if (chunk.type === "finish") terminal = chunk;
	}
	return {
		text: assembled,
		reason: terminal?.reason ?? { kind: "stop" },
		seen
	};
}

/**
 * Register the optimize route behind the connection trust fence.
 * @param ctx - the plugin context.
 */
		//#region strategy-market-host
		/**
		 * 行情与建议的宿主代理。
		 *
		 * 参考 crypto-study/om-server/server.mjs：币安公开现货接口经本机代理转发，
		 * 因为浏览器直连会撞 CORS，而 api.binance.com 在本机返回 451，所以同样改用
		 * data-api.binance.vision。与参考实现的差异：参考只代理历史 K 线且不缓存；
		 * 这里额外提供 24h ticker、按 key 的短缓存、超时和错误归一化，供页面轮询。
		 */
		const STRATEGY_MARKET_BASE = "https://data-api.binance.vision";
		const STRATEGY_INTERVALS = new Set(["1m", "5m", "15m", "1h", "4h", "1d"]);
		const STRATEGY_TICKER_TTL_MS = 5_000;
		const STRATEGY_KLINES_TTL_MS = 30_000;
		const STRATEGY_UPSTREAM_TIMEOUT_MS = 8_000;
		const STRATEGY_MAX_SYMBOLS = 10;
		const STRATEGY_DEFAULT_SYMBOLS = ["BNBUSDT", "BTCUSDT", "ETHUSDT"];
		const strategyMarketCache = new Map();

		/** One upstream GET with a hard timeout; JSON errors bubble up as messages. */
		async function strategyFetchJson(url) {
			const response = await fetch(url, { signal: AbortSignal.timeout(STRATEGY_UPSTREAM_TIMEOUT_MS), headers: { accept: "application/json" } });
			if (!response.ok) throw new Error("上游返回 " + response.status);
			return await response.json();
		}

		/** Cached read: the age is returned so the panel can show staleness. */
		async function strategyCached(key, ttlMs, load) {
			const now = Date.now();
			const hit = strategyMarketCache.get(key);
			if (hit !== void 0 && now - hit.at < ttlMs) return { value: hit.value, at: hit.at, cached: true };
			const value = await load();
			strategyMarketCache.set(key, { value, at: now });
			return { value, at: now, cached: false };
		}

		function strategySymbolsFrom(query) {
			const raw = query.get("symbols");
			const list = raw === null || raw === "" ? STRATEGY_DEFAULT_SYMBOLS : raw.split(",").map((item) => item.trim().toUpperCase()).filter(Boolean);
			const unique = [...new Set(list)];
			if (unique.length === 0 || unique.length > STRATEGY_MAX_SYMBOLS) throw new Error("symbols 数量必须在 1-" + STRATEGY_MAX_SYMBOLS + " 之间");
			for (const symbol of unique) if (!/^[A-Z0-9]{5,20}$/.test(symbol)) throw new Error("非法交易对：" + symbol);
			return unique;
		}

		/** Normalize Binance's 24h ticker into the fields the panel renders. */
		function strategyTickerRow(row) {
			return {
				symbol: String(row.symbol),
				price: Number(row.lastPrice),
				changePercent: Number(row.priceChangePercent),
				change: Number(row.priceChange),
				high: Number(row.highPrice),
				low: Number(row.lowPrice),
				volume: Number(row.volume),
				quoteVolume: Number(row.quoteVolume),
				at: Number(row.closeTime)
			};
		}

		/** Summary statistics for the agent; never the raw candles. */
		function strategyKlineSummary(symbol, interval, candles, at) {
			if (candles.length === 0) return { symbol, interval, candles: 0, at };
			const first = candles[0];
			const last = candles[candles.length - 1];
			const closes = candles.map((candle) => candle.c);
			const returns = [];
			for (let index = 1; index < closes.length; index += 1) if (closes[index - 1] > 0) returns.push(closes[index] / closes[index - 1] - 1);
			const mean = returns.length === 0 ? 0 : returns.reduce((sum, value) => sum + value, 0) / returns.length;
			const variance = returns.length === 0 ? 0 : returns.reduce((sum, value) => sum + (value - mean) ** 2, 0) / returns.length;
			const volumes = candles.map((candle) => candle.v);
			const half = Math.max(1, Math.floor(volumes.length / 2));
			const early = volumes.slice(0, half).reduce((sum, value) => sum + value, 0) / half;
			const late = volumes.slice(-half).reduce((sum, value) => sum + value, 0) / half;
			return {
				symbol,
				interval,
				candles: candles.length,
				from: first.t,
				to: last.t,
				at,
				changePercent: first.c > 0 ? Number((((last.c - first.c) / first.c) * 100).toFixed(4)) : null,
				volatilityPercent: Number((Math.sqrt(variance) * 100).toFixed(4)),
				high: Math.max(...candles.map((candle) => candle.h)),
				low: Math.min(...candles.map((candle) => candle.l)),
				volumeChangePercent: early > 0 ? Number((((late - early) / early) * 100).toFixed(2)) : null
			};
		}

		/** Register the two read-only market routes behind the host trust fence. */
		function registerStrategyMarket(ctx, rejected) {
			ctx.effect(() => ctx.webServer.register({
				kind: "exact",
				path: "/strategy/market/ticker",
				handler: async (req, res) => {
					if (rejected(req, res)) return;
					if (req.method !== "GET") return sendMethodNotAllowed(res, "GET");
					let symbols;
					try {
						symbols = strategySymbolsFrom(new URL(req.url, "http://local").searchParams);
					} catch (error) {
						return sendJson(res, 400, { code: "bad-symbols", message: String(error.message) });
					}
					try {
						const { value, at, cached } = await strategyCached("ticker:" + symbols.join(","), STRATEGY_TICKER_TTL_MS, async () => {
							const query = symbols.map((symbol) => "\"" + symbol + "\"").join(",");
							const rows = await strategyFetchJson(STRATEGY_MARKET_BASE + "/api/v3/ticker/24hr?symbols=[" + encodeURIComponent(query) + "]");
							return rows.map(strategyTickerRow);
						});
						sendJson(res, 200, { at, cached, rows: value });
					} catch (error) {
						sendJson(res, 502, { code: "market-unavailable", message: "行情暂不可用：" + String(error.message) });
					}
				}
			}), "strategy: ticker route");

			ctx.effect(() => ctx.webServer.register({
				kind: "exact",
				path: "/strategy/market/klines",
				handler: async (req, res) => {
					if (rejected(req, res)) return;
					if (req.method !== "GET") return sendMethodNotAllowed(res, "GET");
					const query = new URL(req.url, "http://local").searchParams;
					const symbol = String(query.get("symbol") ?? "").toUpperCase();
					const interval = String(query.get("interval") ?? "1h");
					const limit = Number(query.get("limit") ?? 168);
					if (!/^[A-Z0-9]{5,20}$/.test(symbol)) return sendJson(res, 400, { code: "bad-symbol", message: "非法交易对" });
					if (!STRATEGY_INTERVALS.has(interval)) return sendJson(res, 400, { code: "bad-interval", message: "不支持的周期" });
					if (!Number.isFinite(limit) || limit < 1 || limit > 1000) return sendJson(res, 400, { code: "bad-limit", message: "limit 必须在 1-1000" });
					try {
						const { value, at, cached } = await strategyCached("klines:" + symbol + ":" + interval + ":" + limit, STRATEGY_KLINES_TTL_MS, async () => {
							const rows = await strategyFetchJson(STRATEGY_MARKET_BASE + "/api/v3/klines?symbol=" + symbol + "&interval=" + interval + "&limit=" + limit);
							return rows.map((row) => ({ t: Number(row[0]), o: Number(row[1]), h: Number(row[2]), l: Number(row[3]), c: Number(row[4]), v: Number(row[5]) }));
						});
						sendJson(res, 200, { symbol, interval, at, cached, count: value.length, candles: value, summary: strategyKlineSummary(symbol, interval, value, at) });
					} catch (error) {
						sendJson(res, 502, { code: "market-unavailable", message: "历史行情暂不可用：" + String(error.message) });
					}
				}
			}), "strategy: klines route");
		}
		//#endregion

		//#region strategy-suggest-host
		/** 参数建议路由：只回建议，不改配置；模型走 profile 的默认路由。 */
		const STRATEGY_SUGGEST_ROUTE = "/strategy/suggest";
		const STRATEGY_SUGGEST_MAX_TOKENS = 4096;
		const STRATEGY_FENCE = String.fromCharCode(96).repeat(3);
		const STRATEGY_SUGGEST_FIELDS = ["maxBuyTax", "maxSellTax", "maxBuyBnb", "buyPercent", "stopLossPercent", "takeProfitMarketCap", "sellAt2xPercent", "sellAt4xPercent", "followWindowSeconds", "noBuyExitSeconds"];
		/** Host-side copy of the field contract, so the prompt never trusts client text. */
		const STRATEGY_FIELD_SPECS = {
			maxBuyTax: { label: "最大买入税率 %", min: 0, max: 100, step: "0.1" },
			maxSellTax: { label: "最大卖出税率 %", min: 0, max: 100, step: "0.1" },
			maxBuyBnb: { label: "单笔买入上限 BNB", min: 0, exclusiveMin: true, step: "0.01" },
			buyPercent: { label: "买入总量 %", min: 0, max: 100, exclusiveMin: true, step: "0.1" },
			stopLossPercent: { label: "止损 %", min: -100, max: 0, step: "1" },
			takeProfitMarketCap: { label: "市值止盈 $", min: 0, exclusiveMin: true, step: "1000" },
			sellAt2xPercent: { label: "翻倍出本(x2)卖出 %", min: 0, max: 100, step: "1" },
			sellAt4xPercent: { label: "二段止盈(x4)卖出 %", min: 0, max: 100, step: "1" },
			followWindowSeconds: { label: "跟单窗口 秒", min: 0, exclusiveMin: true, step: "1" },
			noBuyExitSeconds: { label: "无买单平仓 秒", min: 0, exclusiveMin: true, step: "1" }
		};

		function strategySuggestSystemPrompt() {
			return [
				"你是加密货币交易策略的参数审阅助手。",
				"你的整条回复必须是一个 JSON 对象：第一个字符是 {，最后一个字符是 }。",
				"禁止 Markdown 表格、代码块围栏、前后说明或寒暄；无法给出建议时输出 {\"suggestions\":[]}。",
				"JSON 形状：{\"suggestions\":[{\"strategyId\":\"A|D|E\",\"field\":\"字段名\",\"value\":数值,\"reason\":\"修改理由\",\"impact\":\"预期影响\"}]}",
				"约束：",
				"1. 只能建议上面给出的字段和策略；value 必须是数字（不是字符串）；",
				"2. 必须落在该字段的取值范围内，否则建议无效；",
				"3. 只提出确实需要改的项，最多 12 条；没有把握时宁可不提；",
				"4. 理由里若引用行情，请写明具体指标（如区间涨跌幅、波动率、成交量变化）；未提供行情时不要编造；",
				"5. 不涉及下单、钱包、私钥或交易所操作。",
				"每一条必须同时有 strategyId、field、value、reason、impact 五个键；reason 和 impact 必须是非空中文短句。",
				"禁止输出整张策略卡（不要 parameters 对象），必须逐字段列出。",
				"示例：{\"suggestions\":[{\"strategyId\":\"A\",\"field\":\"maxBuyTax\",\"value\":6,\"reason\":\"BNB 24h 振幅收窄，降低税率门槛减少低质量成交\",\"impact\":\"成交更保守\"}]}"
			].join("\n");
		}

		/** Compact request: local strategies + rankings + review + market summary. */
		function strategySuggestUserPrompt(payload) {
			return JSON.stringify({
				instruction: payload.instruction,
				strategies: payload.strategies,
				savedDifferences: payload.savedDifferences,
				rankings: payload.rankings,
				review: payload.review,
				market: payload.market,
				fields: STRATEGY_SUGGEST_FIELDS.map((key) => ({ key, ...STRATEGY_FIELD_SPECS[key] }))
			});
		}

		/** Strip an accidental fence and keep the first JSON object. */
		function strategyParseModelJson(text) {
			let trimmed = String(text).trim();
			if (trimmed.startsWith(STRATEGY_FENCE)) trimmed = trimmed.slice(STRATEGY_FENCE.length).trim();
			if (trimmed.startsWith("json")) trimmed = trimmed.slice(4).trim();
			if (trimmed.endsWith(STRATEGY_FENCE)) trimmed = trimmed.slice(0, -STRATEGY_FENCE.length).trim();
			const start = trimmed.indexOf("{");
			const end = trimmed.lastIndexOf("}");
			if (start === -1 || end <= start) throw new Error("模型没有返回 JSON");
			const parsed = JSON.parse(trimmed.slice(start, end + 1));
			if (parsed === null || typeof parsed !== "object" || !Array.isArray(parsed.suggestions)) throw new Error("JSON 缺少 suggestions 数组");
			return parsed.suggestions;
		}

		/** Every item must be one field change with its own reasoning. */
		function strategyValidateSuggestionShape(list) {
			if (!Array.isArray(list)) throw new Error("suggestions 必须是数组");
			for (const item of list) {
				if (item === null || typeof item !== "object") throw new Error("suggestions 项必须是对象");
				if (typeof item.strategyId !== "string" || typeof item.field !== "string") throw new Error("suggestions 项缺少 strategyId 或 field");
				if (typeof item.value !== "number" || !Number.isFinite(item.value)) throw new Error("suggestions 项的 value 必须是数字");
				if (typeof item.reason !== "string" || item.reason.trim() === "") throw new Error("suggestions 项缺少 reason");
			}
			return list;
		}

		/** One streaming call; throws on transport errors or an error finish. */
		async function strategyAskModel(ctx, route, messages) {
			let text = "";
			let terminal;
			for await (const chunk of ctx.llm.stream({
				provider: route.provider,
				model: route.model,
				messages,
				maxTokens: STRATEGY_SUGGEST_MAX_TOKENS
			})) {
				if (chunk.type === "text-delta") text += chunk.text;
				if (chunk.type === "finish") terminal = chunk;
			}
			if (terminal !== void 0 && terminal.reason !== void 0 && terminal.reason.kind === "error") throw new Error(String(terminal.reason.failure === void 0 ? terminal.reason.kind : terminal.reason.failure.message));
			return text;
		}

		function registerStrategySuggest(ctx, rejected) {
			ctx.effect(() => ctx.webServer.register({
				kind: "exact",
				path: STRATEGY_SUGGEST_ROUTE,
				handler: async (req, res) => {
					if (rejected(req, res)) return;
					if (req.method !== "POST") return sendMethodNotAllowed(res, "POST");
					if (String(req.headers["content-type"]).split(";", 1)[0]?.trim().toLowerCase() !== "application/json") return sendJson(res, 415, { code: "unsupported-media-type", message: "content-type must be application/json" });
					let text;
					try {
						text = await readBoundedBody(req);
					} catch {
						return sendJson(res, 400, { code: "bad-request", message: "请求体不可读" });
					}
					if (text === null) return sendJson(res, 413, { code: "payload-too-large", message: "请求体过大" });
					let payload;
					try {
						payload = JSON.parse(text);
					} catch {
						return sendJson(res, 400, { code: "bad-request", message: "请求体必须是 JSON" });
					}
					if (payload === null || typeof payload !== "object" || typeof payload.instruction !== "string" || payload.instruction.trim() === "") return sendJson(res, 400, { code: "bad-request", message: "缺少 instruction" });
					if (payload.instruction.length > 4000) return sendJson(res, 400, { code: "bad-request", message: "instruction 过长" });
					if (!Array.isArray(payload.strategies) || payload.strategies.length !== 3) return sendJson(res, 400, { code: "bad-request", message: "strategies 必须包含 A/D/E 三项" });
					const route = payload.route !== void 0 && typeof payload.route.provider === "string" && typeof payload.route.model === "string" ? payload.route : resolveRoute(ctx);
					if (route === void 0) return sendJson(res, 503, { code: "no-model", message: "没有可用的默认模型：请在设置里选择 agent default model" });
					const market = payload.market === null || payload.market === void 0 ? null : payload.market;
					const messages = [
						pluginMessage("system", strategySuggestSystemPrompt()),
						pluginMessage("user", strategySuggestUserPrompt({
							instruction: payload.instruction.trim(),
							strategies: payload.strategies,
							savedDifferences: payload.savedDifferences === void 0 ? [] : payload.savedDifferences,
							rankings: payload.rankings === void 0 ? [] : payload.rankings,
							review: payload.review === void 0 ? [] : payload.review,
							market
						}))
					];
					let answer = "";
					try {
						answer = await strategyAskModel(ctx, route, messages);
					} catch (error) {
						return sendJson(res, 502, { code: "model-failure", message: "模型调用失败：" + String(error instanceof Error ? error.message : error) });
					}
					let suggestions;
					try {
						suggestions = strategyValidateSuggestionShape(strategyParseModelJson(answer));
					} catch (firstError) {
						/**
						 * 聊天型模型偶尔会先写一段说明再给 JSON；只重试一次，
						 * 把它的原文和一条“只要 JSON”的纠正一起发回去。
						 */
						try {
							const repair = messages.concat([
								pluginMessage("assistant", answer),
								pluginMessage("user", "上一条回复不符合要求。请只输出 {\"suggestions\":[{\"strategyId\":\"A\",\"field\":\"maxBuyTax\",\"value\":6,\"reason\":\"…\",\"impact\":\"…\"}]}：逐字段、带 reason/impact，禁止 parameters 整卡对象和任何其他文字。")
							]);
							const repaired = await strategyAskModel(ctx, route, repair);
							suggestions = strategyParseModelJson(repaired);
						} catch {
							return sendJson(res, 422, { code: "bad-model-output", message: "模型返回格式不合法：" + String(firstError.message), sample: answer.slice(0, 600) });
						}
					}
					sendJson(res, 200, {
						ok: true,
						model: route.provider + "/" + route.model,
						usedMarket: market !== null,
						suggestions
					});
				}
			}), "strategy: suggest route");
		}
		//#endregion

function apply(ctx, config) {
	/**
	 * System placement is a configuration choice, not a constant, because the
	 * profile patch layer can flip it live: config edits recompose the profile
	 * without restarting the host.
	 */
	const systemPlacement = config !== null && config !== void 0 && config.systemPlacement === "after" ? "after" : "first";
	/** Answer an untrusted or unauthenticated request; true when it was rejected. */
	const rejected = (req, res) => {
		const rejection = ctx.connection.requestRejection(req);
		if (rejection === void 0) return false;
		res.statusCode = rejection;
		res.end();
		return true;
	};
	/**
	 * Enumerate models the panel may pin. `listModels` is adapter-backed and may
	 * reject for a provider that cannot answer, so one failing provider is
	 * skipped rather than emptying the whole picker.
	 */
	ctx.effect(() => ctx.webServer.register({
		kind: "exact",
		path: MODELS_ROUTE,
		handler: async (req, res) => {
			if (rejected(req, res)) return;
			if (req.method !== "GET") {
				sendMethodNotAllowed(res, "GET");
				return;
			}
			const groups = [];
			for (const provider of ctx.llm.listProviders?.() ?? []) {
				try {
					const models = await ctx.llm.listModels(provider.id);
					const rows = [];
					for (const entry of models) {
						/**
						 * Reasoning metadata is per exact model, not per provider: the same
						 * provider serves text models with different effort ladders. A model
						 * that cannot answer the query simply carries no ladder.
						 */
						let efforts;
						let defaultEffort;
						try {
							const info = await (ctx.llm.resolveModelInfo ?? ctx.llm.resolveModel)?.(provider.id, entry.id);
							if (Array.isArray(info?.reasoning?.efforts) && info.reasoning.efforts.length > 0) {
								efforts = info.reasoning.efforts.map((effort) => ({ id: effort.id, name: effort.name }));
								defaultEffort = info.reasoning.defaultEffort;
							}
						} catch {
							/* No ladder: the picker falls back to the shared names. */
						}
						rows.push({
							id: entry.id,
							name: entry.name ?? entry.id,
							...efforts === void 0 ? {} : { efforts },
							...defaultEffort === void 0 ? {} : { defaultEffort }
						});
					}
					groups.push({
						provider: provider.id,
						name: provider.name,
						models: rows
					});
				} catch {
					continue;
				}
			}
			sendJson(res, 200, {
				current: resolveRoute(ctx) ?? null,
				groups,
				/**
				 * The template catalog rides along so the panel renders the real
				 * `optimizationMode` axis from the server's own data instead of a second
				 * hardcoded list that can drift from these templates.
				 */
				/**
				 * Panel order is a product decision, not the registry order: 用户提示词
				 * first, 系统提示词 second. The catalog still decides which modes exist.
				 */
				modes: [...OPTIMIZATION_MODES].sort((left, right) => {
					const rank = (id) => ["user", "system", "iterate"].indexOf(id) === -1 ? 3 : ["user", "system", "iterate"].indexOf(id);
					return rank(left.id) - rank(right.id);
				}),
				/**
				 * `variables` is derived by parsing each template, not hand-written, so
				 * the panel can never be told a template needs a field it does not read.
				 * `simple` marks the bare-string family, whose target prompt travels as
				 * its own user message rather than as a JSON slot.
				 */
				templates: Object.values(TEMPLATES).filter((template) => template.optimizationMode !== void 0).map((template) => ({
					id: template.id,
					label: template.label,
					optimizationMode: template.optimizationMode,
					templateType: template.templateType,
					simple: isSimpleTemplate(template),
					variables: templateVariables(template),
					fields: template.fields
				})),
				/**
				 * Which template each mode starts on, resolved through the same
				 * `getDefaultTemplateId` the optimize route falls back to — so the
				 * panel's first pick follows the documented upstream default (the
				 * user family opens on 专业优化) instead of registry order, and the
				 * client never hardcodes an id.
				 */
				defaults: {
					system: getDefaultTemplateId("optimize"),
					user: getDefaultTemplateId("userOptimize"),
					iterate: getDefaultTemplateId("iterate")
				},
				extraction: getTemplate("variable-extraction") !== void 0,
				/**
				 * The host's message-layout choice, so the panel can show which half
				 * it is talking to instead of guessing from behaviour.
				 */
				systemPlacement,
				/** Reload probe: changes when the host implementation is swapped. */
				hostStamp: HOST_STAMP
			});
		}
	}), `prompt-polish: GET ${MODELS_ROUTE}`);
	ctx.effect(() => ctx.webServer.register({
		kind: "exact",
		path: OPTIMIZE_ROUTE,
		handler: async (req, res) => {
			if (rejected(req, res)) return;
			if (req.method !== "POST") {
				sendMethodNotAllowed(res, "POST");
				return;
			}
			if (String(req.headers["content-type"]).split(";", 1)[0]?.trim().toLowerCase() !== "application/json") {
				sendJson(res, 415, {
					code: "unsupported-media-type",
					message: "content-type must be application/json"
				});
				return;
			}
			let text;
			try {
				text = await readBoundedBody(req);
			} catch {
				sendJson(res, 400, {
					code: "bad-request",
					message: "request body unreadable"
				});
				return;
			}
			if (text === null) {
				sendJson(res, 413, {
					code: "payload-too-large",
					message: "request body is too large"
				});
				return;
			}
			const request = parseBody(text);
			if (request === null) {
				sendJson(res, 400, {
					code: "bad-request",
					message: 'body must be JSON: { optimizationMode: "system" | "user" | "iterate", targetPrompt: string, templateId?, lastOptimizedPrompt?, iterateInput?, contextMode?, advancedContext? }'
				});
				return;
			}
			if (request.unsupported !== void 0) {
				sendJson(res, 400, {
					code: "unsupported",
					message: request.unsupported === "inputImages" ?
						"暂不支持图片输入：附件字节还取不到，请先用文字描述图片内容。" :
						"模板与优化对象不一致：请重新选择一个匹配当前优化对象的模板。"
				});
				return;
			}
			/** A pinned panel choice wins; otherwise follow the composer. */
			const route = request.route ?? resolveRoute(ctx);
			if (route === void 0) {
				sendJson(res, 503, {
					code: "no-model",
					message: "没有可用的默认模型：请在设置里选择 agent default model，或在面板里指定一个模型后重试。"
				});
				return;
			}
			/**
			 * `buildMessages` is where the two template families diverge, and the
			 * divergence is preserved on purpose: a bare-string template becomes the
			 * system message **unrendered** plus the raw target as a user turn, while a
			 * message-array template is mustache-rendered with the full context. See
			 * `processor.js`.
			 *
			 * System placement is load-bearing. The pi-ai adapter takes the system
			 * prompt from `options.system` when that is defined, and then FOLDS any
			 * `system` message inside `messages` into a plain `user` turn — so passing
			 * both would silently demote the template's persona. Only with
			 * `options.system` omitted does a LEADING `system` message become the real
			 * `systemPrompt`, which is exactly what the ported templates expect.
			 */
			/**
			 * User-mode polishing runs against a fork of the current conversation:
			 * the session's derived history is copied in, never written back. Other
			 * modes stay single-shot so they cannot be steered by the thread.
			 */
					const fork = request.optimizationMode === "user" && request.forkContext ? await readForkedHistory(ctx, request.sessionId) : { turns: [] };
			const history = fork.turns;
			const messages = buildMessages(request.template, request.context, {
				history,
				systemPlacement
			}).map((message) => pluginMessage(message.role, message.content));
			res.statusCode = 200;
			res.setHeader("content-type", "application/x-ndjson; charset=utf-8");
			res.setHeader("cache-control", "no-store");
			res.setHeader("x-accel-buffering", "no");
			/** One JSON document per line; the browser parses incrementally. */
			const emit = (event) => {
				if (!res.writableEnded) res.write(JSON.stringify(event) + "\n");
			};
			/** The client stopped watching: stop paying for tokens. */
			const abort = new AbortController();
			req.on("aborted", () => abort.abort());
			res.on("close", () => abort.abort());
			let assembled = "";
			let terminal;
			let usage;
			/**
			 * Chunk-type histogram. An empty result is otherwise indistinguishable from
			 * a silent provider failure, and this composition writes no log file to
			 * tell them apart — so the diagnosis rides back to the panel instead.
			 */
			const seen = new Map();
			try {
				for await (const chunk of ctx.llm.stream({
					provider: route.provider,
					model: route.model,
					messages,
					/**
					 * No `temperature`: this provider serves a reasoning model through the
					 * Responses API, and a sampling parameter it declines to accept would
					 * fail the call outright. The rewrite is deterministic enough without it.
					 */
					maxTokens: MAX_TOKENS,
					...request.reasoningEffort === void 0 ? {} : { reasoningEffort: request.reasoningEffort },
					signal: abort.signal
				})) {
					seen.set(chunk.type, (seen.get(chunk.type) ?? 0) + 1);
					if (chunk.type === "text-delta") {
						assembled += chunk.text;
						emit({
							type: "delta",
							text: chunk.text
						});
						continue;
					}
					/**
					 * The stream carries token counts as their own chunk type
					 * (`{ type:'usage', usage: TokenUsage }` in the host's StreamChunk
					 * union). Relayed on the done event so the panel can show the
					 * doc-standard result metadata; providers that report nothing
					 * simply leave it absent.
					 */
					if (chunk.type === "usage") {
						usage = chunk.usage;
						continue;
					}
					if (chunk.type === "finish") terminal = chunk;
				}
			} catch (error) {
				emit({
					type: "error",
					message: error instanceof Error ? error.message : String(error)
				});
				res.end();
				return;
			}
			/**
			 * `reason` is a discriminated object (`{ kind, failure? }`), not a string —
			 * comparing it to `"error"` silently hid every real failure behind the
			 * empty-result message. Switch on `kind` and surface the provider's own
			 * words, since this composition writes no log to consult afterwards.
			 */
			const reason = terminal?.reason ?? { kind: "stop" };
			const cleaned = extractPrompt(assembled);
			const where = `${route.provider}/${route.model}`;
			if (cleaned === "") {
				const detail = "failure" in reason && reason.failure !== void 0 ? `：${reason.failure.message}` : "";
				emit({
					type: "error",
					/**
					 * Name the model in every failure. A provider that rejects an image
					 * model for a text call says so in its own words, which means
					 * nothing unless the user can see which model was tried.
					 */
					message: reason.kind === "aborted" ? "润色已取消。" : reason.kind === "error" ? `模型调用失败（${where}）${detail}` : reason.kind === "max-tokens" ? `${where} 把输出预算全花在推理上，没有产出正文。换个模型或缩短输入。` : `${where} 没有返回正文（finish=${reason.kind}；${summarize(seen) || "无任何 chunk"}）`
				});
			} else {
				emit({
					type: "done",
					text: cleaned,
					model: `${route.provider}/${route.model}`,
					truncated: reason.kind === "max-tokens",
					/** What the fork actually carried, so the panel can say so. */
					context: {
						attached: history.length,
						systemPlacement,
						...fork.reason === void 0 ? {} : { reason: fork.reason }
					},
					usage: usage === void 0 || usage === null ? void 0 : {
						inputTokens: usage.inputTokens,
						outputTokens: usage.outputTokens,
						totalTokens: usage.totalTokens
					}
				});
			}
			res.end();
		}
	}), `prompt-polish: POST ${OPTIMIZE_ROUTE}`);
	/**
	 * Extract parameterisable variables from a finished prompt. Separate route,
	 * separate call, JSON in / JSON out — mirroring the way upstream splits this
	 * off into `VariableExtractionService` instead of a mode of the optimizer.
	 */
	registerStrategyMarket(ctx, rejected);
		registerStrategySuggest(ctx, rejected);
		ctx.effect(() => ctx.webServer.register({
		kind: "exact",
		path: EXTRACT_ROUTE,
		handler: async (req, res) => {
			if (rejected(req, res)) return;
			if (req.method !== "POST") {
				sendMethodNotAllowed(res, "POST");
				return;
			}
			if (String(req.headers["content-type"]).split(";", 1)[0]?.trim().toLowerCase() !== "application/json") {
				sendJson(res, 415, {
					code: "unsupported-media-type",
					message: "content-type must be application/json"
				});
				return;
			}
			const text = await readBoundedBody(req);
			if (text === null) {
				sendJson(res, 413, {
					code: "payload-too-large",
					message: "request body is too large"
				});
				return;
			}
			let body;
			try {
				body = JSON.parse(text);
			} catch {
				body = null;
			}
			if (typeof body !== "object" || body === null || Array.isArray(body)) {
				sendJson(res, 400, {
					code: "bad-request",
					message: "body must be JSON: { promptContent: string, existingVariableNames?: string[] }"
				});
				return;
			}
			const promptContent = body.promptContent;
			if (typeof promptContent !== "string" || promptContent.trim() === "" || promptContent.length > MAX_FIELD_CHARS) {
				sendJson(res, 400, {
					code: "bad-request",
					message: "promptContent 必须是非空字符串。"
				});
				return;
			}
			const names = Array.isArray(body.existingVariableNames) ? body.existingVariableNames.filter((entry) => typeof entry === "string" && entry !== "") : [];
			const route = typeof body.provider === "string" && typeof body.model === "string" ? {
				provider: body.provider,
				model: body.model
			} : resolveRoute(ctx);
			if (route === void 0) {
				sendJson(res, 503, {
					code: "no-model",
					message: "没有可用的默认模型：请在设置里选择 agent default model，或在面板里指定一个模型后重试。"
				});
				return;
			}
			const template = getTemplate("variable-extraction");
			/**
			 * Upstream's exact context trio. `existingVariableNames` is a joined string
			 * with the literal "None" default, and the boolean drives the
			 * `{{#hasExistingVariables}}` branch in the system message.
			 */
			const context = createTemplateContext({
				promptContent,
				variables: {
					existingVariableNames: names.length > 0 ? names.join(", ") : "None",
					hasExistingVariables: names.length > 0
				}
			});
			let completion;
			try {
				completion = await collectCompletion(ctx, route, buildMessages(template, context).map((message) => pluginMessage(message.role, message.content)));
			} catch (error) {
				sendJson(res, 502, {
					code: "model-failure",
					message: `变量提取调用失败（${route.provider}/${route.model}）：${error instanceof Error ? error.message : String(error)}`
				});
				return;
			}
			let result;
			try {
				result = parseExtractionResult(completion.text);
			} catch (error) {
				sendJson(res, 502, {
					code: "bad-model-output",
					message: `${error instanceof Error ? error.message : String(error)}（${summarize(completion.seen) || "无任何 chunk"}）`
				});
				return;
			}
			/**
			 * Substituting the spans is part of the same answer: the browser would
			 * otherwise need its own copy of the occurrence arithmetic, and a wrong
			 * offset silently rewrites the user's text. A position that does not match
			 * the source fails the call rather than returning a half-templated prompt.
			 */
			/**
			 * Substituting the spans is best-effort, NOT another gate. The names and
			 * values are useful on their own; failing the whole call because one span
			 * drifted would throw away a good answer. So a mismatch comes back as
			 * `templated: null` with the reason, and the panel disables 写回模板 instead
			 * of showing nothing.
			 */
			let templated = null;
			let templatedError = "";
			try {
				templated = applyVariables(promptContent, result.variables);
			} catch (error) {
				templatedError = error instanceof Error ? error.message : String(error);
			}
			sendJson(res, 200, {
				...result,
				templated,
				...(templatedError === "" ? {} : { templatedError }),
				model: `${route.provider}/${route.model}`
			});
		}
	}), `prompt-polish: POST ${EXTRACT_ROUTE}`);
}

export { EXTRACT_ROUTE, MODELS_ROUTE, OPTIMIZE_ROUTE, apply, inject, name };