/**
 * 策略管理：领域行为回归。
 *
 * 直接加载客户端 bundle（与 DSH 的模块系统同一入口），从 exports.__strategy
 * 取纯函数；不依赖浏览器、不启动服务。12 项对应交接文档 5.2 的映射：
 * 前 9 项是源版 model.test 的行为，后 3 项是独立 server 测试在插件里的等价断言
 * （无服务端、无网络、本地命名空间与原子写入）。
 */
import { readFileSync } from "node:fs";
import { pathToFileURL, fileURLToPath } from "node:url";
import vm from "node:vm";

const PROFILE = fileURLToPath(new URL(".", import.meta.url));
const BUNDLE = PROFILE + "/lib/client.js";
const fail = [];
const ok = (label, cond, extra) => {
	console.log((cond ? "PASS " : "FAIL ") + label + (cond || extra === void 0 ? "" : " -> " + JSON.stringify(extra)));
	if (!cond) fail.push(label);
};

let factory;
const sandbox = vm.createContext({
	window: { __ModuleLoader__: { load: (row) => { factory = row.factory; } } },
	document: void 0,
	console
});
new vm.Script(readFileSync(BUNDLE, "utf8"), { filename: "client.js" }).runInContext(sandbox);
const React = {
	createElement: () => ({}),
	useState: (init) => [typeof init === "function" ? init() : init, () => {}],
	useRef: (init) => ({ current: init }),
	useEffect: () => {},
	useCallback: (fn) => fn,
	useMemo: (fn) => fn()
};
const plugin = factory((spec) => {
	if (spec === "react") return React;
	throw new Error("unexpected require: " + spec);
});
const S = plugin.__strategy;
ok("bundle exposes the strategy model", S !== void 0 && typeof S.createDefaultConfigs === "function");
ok("storage key and version match the source contract", S.STORAGE_KEY === "strategy-dashboard.config.v1" && S.STORAGE_VERSION === 1, S.STORAGE_KEY);

/* 1. 默认值与排行固定，且每次默认对象独立 */
const defaults = S.createDefaultConfigs();
ok("defaults keep the A/D/E screenshot values", JSON.stringify(defaults) === JSON.stringify([
	{ id: "A", enabled: true, parameters: { maxBuyTax: 8, maxSellTax: 10, maxBuyBnb: 0.3, buyPercent: 2, stopLossPercent: -50, takeProfitMarketCap: 300000, sellAt2xPercent: 50, sellAt4xPercent: 50 } },
	{ id: "D", enabled: true, parameters: { maxBuyTax: 8, maxSellTax: 10, maxBuyBnb: 0.15, buyPercent: 1, stopLossPercent: -50, takeProfitMarketCap: 300000, sellAt2xPercent: 50, sellAt4xPercent: 50 } },
	{ id: "E", enabled: true, parameters: { maxBuyTax: 8, maxSellTax: 10, maxBuyBnb: 0.15, buyPercent: 1, followWindowSeconds: 2, noBuyExitSeconds: 10 } }
]), JSON.stringify(defaults));
defaults[0].parameters.maxBuyTax = 99;
ok("each call returns its own default objects", S.createDefaultConfigs()[0].parameters.maxBuyTax === 8);
ok("rankings are the fixed K/F/D/A samples", S.RANKINGS.map((row) => row.id).join(",") === "K,F,D,A" && S.RANKINGS[0].pnl === "+3.0083 BNB");

/* 2. 空/中间态不夹值，合法字符串转换 */
const drafts = S.createDrafts();
const emptyDraft = { enabled: true, parameters: Object.assign({}, drafts.A.parameters, { maxBuyTax: "" }) };
ok("an empty string is not silently coerced", S.validateDraft("A", emptyDraft).ok === false && S.validateDraft("A", emptyDraft).errors.maxBuyTax === "请输入数值");
ok("a lone minus is rejected, not turned into 0", S.validateDraft("A", { enabled: true, parameters: Object.assign({}, drafts.A.parameters, { stopLossPercent: "-" }) }).ok === false);
const converted = S.validateDraft("A", { enabled: true, parameters: Object.assign({}, drafts.A.parameters, { maxBuyTax: " 9 ", stopLossPercent: "-50" }) });
ok("valid numeric strings convert to numbers", converted.ok === true && converted.config.parameters.maxBuyTax === 9 && converted.config.parameters.stopLossPercent === -50, JSON.stringify(converted));

/* 3. 边界、有限性、分段卖出 */
const withParam = (id, key, value) => ({ enabled: true, parameters: Object.assign({}, drafts[id].parameters, { [key]: value }) });
ok("tax 101 is out of range", S.validateDraft("A", withParam("A", "maxBuyTax", "101")).ok === false);
ok("tax 0 and 100 are allowed", S.validateDraft("A", withParam("A", "maxBuyTax", "0")).ok === true && S.validateDraft("A", withParam("A", "maxBuyTax", "100")).ok === true);
ok("stop loss allows -100 and 0", S.validateDraft("A", withParam("A", "stopLossPercent", "-100")).ok === true && S.validateDraft("A", withParam("A", "stopLossPercent", "0")).ok === true);
ok("stop loss rejects -101", S.validateDraft("A", withParam("A", "stopLossPercent", "-101")).ok === false);
ok("BNB must be greater than 0", S.validateDraft("A", withParam("A", "maxBuyBnb", "0")).ok === false && S.validateDraft("A", withParam("A", "maxBuyBnb", "0.001")).ok === true);
ok("seconds accept decimals (step is metadata only)", S.validateDraft("E", withParam("E", "followWindowSeconds", "0.1")).ok === true);
ok("90/90 split stays legal", S.validateDraft("A", { enabled: true, parameters: Object.assign({}, drafts.A.parameters, { sellAt2xPercent: "90", sellAt4xPercent: "90" }) }).ok === true);
ok("Infinity and hex are rejected", S.validateDraft("A", withParam("A", "maxBuyTax", "Infinity")).ok === false && S.validateDraft("A", withParam("A", "maxBuyTax", "0x10")).ok === false);

/* 4. 严格 JSON：id/类型/缺键/多键/原型键 */
const validA = { id: "A", enabled: true, parameters: Object.assign({}, defaults[0].parameters) };
ok("a well-formed config passes", S.validateConfig(validA, "A").ok === true);
ok("wrong id is rejected", S.validateConfig(Object.assign({}, validA, { id: "B" }), "A").ok === false);
ok("numeric strings are rejected in JSON", S.validateConfig({ id: "A", enabled: true, parameters: Object.assign({}, validA.parameters, { maxBuyTax: "8" }) }).ok === false);
ok("a missing key is rejected", S.validateConfig({ id: "A", enabled: true, parameters: { maxBuyTax: 8 } }).ok === false);
ok("an extra key is rejected", S.validateConfig({ id: "A", enabled: true, parameters: Object.assign({}, validA.parameters, { extra: 1 }) }).ok === false);
const protoParameters = Object.assign({}, validA.parameters);
Object.defineProperty(protoParameters, "__proto__", { value: 1, enumerable: true, configurable: true });
ok("a __proto__ own key is rejected", S.validateConfig({ id: "A", enabled: true, parameters: protoParameters }).ok === false);
ok("enabled must be boolean", S.validateConfig({ id: "A", enabled: "true", parameters: validA.parameters }).ok === false);
ok("top-level extras are rejected", S.validateConfig(Object.assign({}, validA, { note: "x" }), "A").ok === false);

/* 5. 保存格式往返（含暂停和自定义值） */
const custom = defaults.map((config) => config.id === "D"
	? { id: "D", enabled: false, parameters: Object.assign({}, config.parameters, { maxBuyTax: 9.5, stopLossPercent: -25 }) }
	: config);
const roundTrip = S.parseStoredState(S.serializeState(custom));
ok("serialize -> parse round-trips paused state and custom values", roundTrip.recovered === false && JSON.stringify(roundTrip.configs) === JSON.stringify(custom), JSON.stringify(roundTrip));

/* 6. 损坏/版本/重复 ID 的恢复 */
ok("missing storage loads defaults without a warning", S.parseStoredState(null).recovered === false && S.parseStoredState(null).error === null);
const corrupted = S.parseStoredState("{not json");
ok("corrupted JSON recovers to defaults with a warning", corrupted.recovered === true && corrupted.configs.length === 3 && typeof corrupted.error === "string");
ok("a wrong version recovers", S.parseStoredState(JSON.stringify({ version: 2, configs: [] })).recovered === true);
const duplicated = [...defaults.slice(0, 2), defaults[1]];
ok("serializing duplicate ids throws", (() => { try { S.serializeState(duplicated); return false; } catch { return true; } })());
ok("serializing an incomplete list throws", (() => { try { S.serializeState(defaults.slice(0, 2)); return false; } catch { return true; } })());

/* 7. 单卡合并只替换本卡 */
const merged = S.mergeSavedConfig(defaults, { id: "A", enabled: true, parameters: Object.assign({}, defaults[0].parameters, { maxBuyTax: 9 }) });
ok("single-card merge replaces only that card", merged[0].parameters.maxBuyTax === 9 && merged[1].parameters.maxBuyTax === 8 && merged[2].parameters.maxBuyTax === 8);
ok("a draft of another card is unaffected by that merge", S.isDraftDirty(drafts.D, defaults[1]) === false);
ok("dirty detection sees an edited field", S.isDraftDirty({ enabled: true, parameters: Object.assign({}, drafts.A.parameters, { maxBuyTax: "9" }) }, defaults[0]) === true);
ok("dirty detection sees an invalid draft", S.isDraftDirty({ enabled: true, parameters: Object.assign({}, drafts.A.parameters, { maxBuyTax: "" }) }, defaults[0]) === true);

/* 8. CSV：BOM、19 列、3 行、当前值、拒绝非法 */
const csv = S.buildFeaturesCsv(merged);
const csvLines = csv.replace(/^\uFEFF/, "").split("\r\n").filter(Boolean);
ok("CSV starts with a BOM", csv.charCodeAt(0) === 0xFEFF);
ok("CSV header has 19 English columns", csvLines[0].split(",").length === 19 && csvLines[0].startsWith("strategy_id,strategy_name,enabled,net_pnl_bnb"));
ok("CSV carries three strategy rows", csvLines.length === 4);
ok("CSV includes the current unsaved value", csvLines[1].split(",").includes("9"));
ok("CSV marks inapplicable parameters empty", csvLines[1].split(",").slice(-2).join(",") === ",");
ok("CSV rejects invalid configs", (() => { try { S.buildFeaturesCsv([{ id: "A", enabled: true, parameters: {} }]); return false; } catch { return true; } })());

/* 9. 复盘只读、样本提醒、剩余 25%、E 警告 */
const before = JSON.stringify(custom);
const review = S.reviewConfigs(custom);
ok("review covers all three strategies", review.length === 3 && review.map((row) => row.id).join(",") === "A,D,E");
const aChecks = review[0].checks.map((row) => row.text).join(" | ");
ok("review warns about the 3-sample floor", aChecks.includes("样本不足"));
ok("review computes the 25% remaining position", aChecks.includes("理论剩余 25%"));
const eReview = S.reviewConfigs(defaults.map((config) => config.id === "E" ? { id: "E", enabled: true, parameters: Object.assign({}, config.parameters, { followWindowSeconds: 5, noBuyExitSeconds: 1 }) } : config));
const eChecks = eReview[2].checks.map((row) => row.text).join(" | ");
ok("E warns when the exit wait is not longer than the follow window", eChecks.includes("请人工检查"), eChecks);
ok("review never mutates enabled or parameters", JSON.stringify(custom) === before, before);
const highTax = S.reviewConfigs(defaults.map((config) => config.id === "A" ? { id: "A", enabled: true, parameters: Object.assign({}, config.parameters, { maxBuyTax: 11 }) } : config));
ok("review flags tax above 10%", highTax[0].checks.some((row) => row.tone === "warning" && row.text.includes("高于 10%")));

/* 10-12. 独立服务测试在插件中的等价断言 */
const source = readFileSync(BUNDLE, "utf8");
const marketRegion = source.slice(source.indexOf("strategy-market-client"), source.indexOf("strategy-dashboard-page"));
ok("#10 the dashboard only calls the plugin's own host routes (no direct external URL, no socket)", !/https?:\/\//.test(marketRegion) && !/XMLHttpRequest|WebSocket|EventSource/.test(marketRegion) && marketRegion.includes("MARKET_TICKER_ROUTE"), marketRegion.slice(0, 120));
ok("#11 the plugin registers no HTTP route for the dashboard", !/webServer|registerRoute|createServer|http\./.test(source.slice(source.indexOf("strategy-dashboard"), source.indexOf("strategy-dashboard-page"))));
ok("#12 storage stays in the documented local namespace and defaults are demo data", S.STORAGE_KEY.startsWith("strategy-dashboard.") && S.STRATEGIES.every((row) => row.metrics.trades === 0 || row.metrics.trades === 6));

/* 页面结构：4 张排行、3 张卡、22 个输入、3 个开关与 demo 提示 */
const ReactTree = {
	createElement: (type, props, ...children) => ({ type, props: props ?? {}, children: children.flat(Infinity) }),
	useState: (init) => [typeof init === "function" ? init() : init, () => {}],
	useRef: (init) => ({ current: init }),
	useEffect: () => {},
	useCallback: (fn) => fn,
	useMemo: (fn) => fn()
};
const store = new Map();
const pageSandbox = vm.createContext({
	window: { __ModuleLoader__: { load: (row) => { factory = row.factory; } }, addEventListener: () => {}, removeEventListener: () => {}, innerWidth: 1440 },
	document: void 0,
	console,
	setTimeout,
	clearTimeout,
	localStorage: { getItem: (key) => (store.has(key) ? store.get(key) : null), setItem: (key, value) => store.set(key, String(value)), removeItem: (key) => store.delete(key) },
	Blob: class {},
	URL: { createObjectURL: () => "blob:x", revokeObjectURL: () => {} }
});
new vm.Script(readFileSync(BUNDLE, "utf8"), { filename: "client.js" }).runInContext(pageSandbox);
const pagePlugin = factory((spec) => {
	if (spec === "react") return ReactTree;
	throw new Error("unexpected require: " + spec);
});
const slotRows = {};
pagePlugin.apply({
	effect: (fn) => { fn(); },
	get slots() {
		return { inject: (name, callback) => { callback(); return () => {}; }, register: (options, component) => { slotRows[options.name] = { options, component }; } };
	}
});
const StrategyPage = slotRows.main.component;
/** React would call a function component; the shim has to do the same. */
const expand = (node) => {
	if (Array.isArray(node)) return node.flatMap(expand);
	if (node === null || typeof node !== "object") return node;
	if (typeof node.type === "function") return expand(node.type(node.props));
	return node;
};
const walk = (node, out = []) => {
	if (node === null || node === void 0 || typeof node !== "object") return out;
	if (Array.isArray(node)) { for (const child of node) walk(child, out); return out; }
	const expanded = expand(node);
	if (expanded === null || typeof expanded !== "object") return out;
	if (Array.isArray(expanded)) { for (const child of expanded) walk(child, out); return out; }
	out.push(expanded);
	walk(expanded.children, out);
	return out;
};
const pageTree = walk(StrategyPage());
const byClass = (name) => pageTree.filter((node) => node.props?.className === name);
const inputs = pageTree.filter((node) => node.props?.className === "hdy-input");
ok("the ranking area starts in the backtest state (no static samples)", byClass("hdy-rank").length === 0 && byClass("hdy-rank hdy-rank-state").length === 1, JSON.stringify(pageTree.filter((node) => String(node.props?.className ?? "").includes("hdy-rank")).map((node) => node.props.className)));
ok("the page renders the three strategy cards", byClass("hdy-card").length === 3);
ok("the page renders 22 parameter inputs", inputs.length === 22, String(inputs.length));
ok("each strategy switch carries its accessible name", ["A", "D", "E"].every((id) => pageTree.some((node) => node.props?.role === "switch" && String(node.props["aria-label"]).includes("策略 " + id))));
ok("stop loss keeps a signed keyboard and tax keeps decimal", inputs.find((node) => node.props.name === "stopLossPercent")?.props.inputMode === "text" && inputs.find((node) => node.props.name === "maxBuyTax")?.props.inputMode === "decimal");
ok("the demo boundary is stated on the page", JSON.stringify(pageTree.filter((node) => node.props?.className === "hdy-footer")).includes("不连接钱包"));
ok("the toolbar carries the four operations", ["保存策略配置", "一键智能复盘优化", "导出 features.csv", "统计特征库"].every((label) => pageTree.some((node) => node.type === "button" && node.children?.join("") === label)));

/* ---- AI 建议：校验、应用与请求载荷 ---- */
const agentDrafts = S.createDrafts();
const accepted = S.validateSuggestion(agentDrafts, { strategyId: "A", field: "maxBuyTax", value: 9.5, reason: "行情波动上升", impact: "降低摩擦成本" });
ok("a valid suggestion passes the same field validator", accepted.ok === true && accepted.value === 9.5 && accepted.from === "8", JSON.stringify(accepted));
const rejectedRange = S.validateSuggestion(agentDrafts, { strategyId: "A", field: "maxBuyTax", value: 101, reason: "", impact: "" });
ok("an out-of-range suggestion is rejected with the field rule", rejectedRange.ok === false && rejectedRange.reason.includes("不能大于"), JSON.stringify(rejectedRange));
const rejectedType = S.validateSuggestion(agentDrafts, { strategyId: "A", field: "maxBuyTax", value: "9", reason: "", impact: "" });
ok("a string value is rejected", rejectedType.ok === false && rejectedType.reason.includes("数字"));
const rejectedField = S.validateSuggestion(agentDrafts, { strategyId: "E", field: "stopLossPercent", value: -50, reason: "", impact: "" });
ok("a field the strategy does not own is rejected", rejectedField.ok === false && rejectedField.reason.includes("没有字段"));
const rejectedUnknown = S.validateSuggestion(agentDrafts, { strategyId: "Z", field: "maxBuyTax", value: 5 });
ok("an unknown strategy is rejected", rejectedUnknown.ok === false);

const applied = S.applySuggestions(agentDrafts, [{ id: "A", field: "maxBuyTax", value: 9.5 }, { id: "D", field: "stopLossPercent", value: -30 }]);
ok("applying suggestions writes only the drafts", applied.A.parameters.maxBuyTax === "9.5" && applied.D.parameters.stopLossPercent === "-30" && agentDrafts.A.parameters.maxBuyTax === "8");
const savedBaseline = S.createDefaultConfigs();
ok("applying suggestions never touches the saved configs", savedBaseline[0].parameters.maxBuyTax === 8 && savedBaseline[1].parameters.stopLossPercent === -50 && applied.A.parameters.maxBuyTax !== String(savedBaseline[0].parameters.maxBuyTax));
const partial = S.applySuggestions(agentDrafts, [{ id: "A", field: "maxBuyTax", value: 6 }]);
ok("partial apply changes exactly the chosen field", partial.A.parameters.maxBuyTax === "6" && partial.A.parameters.maxSellTax === agentDrafts.A.parameters.maxSellTax && partial.D === agentDrafts.D);
ok("discarding (empty apply) keeps the drafts identical", JSON.stringify(S.applySuggestions(agentDrafts, [])) === JSON.stringify(agentDrafts));

const marketSummary = { at: 1_700_000_000_000, symbols: [{ symbol: "BNBUSDT", price: 300, changePercent: 1.2, quoteVolume: 1000 }], history: [{ symbol: "BNBUSDT", interval: "1h", candles: 168, changePercent: 4.2, volatilityPercent: 0.8, high: 310, low: 280, volumeChangePercent: 12 }] };
const payload = S.buildAgentPayload(agentDrafts, defaults, S.RANKINGS, [], marketSummary, "降低 A 的风险");
const payloadText = JSON.stringify(payload);
ok("the agent payload carries drafts, saved differences and market summary", payload.strategies.length === 3 && Array.isArray(payload.savedDifferences) && payload.market.history[0].candles === 168);
ok("the agent payload never carries raw candles", !payloadText.includes("\"candles\":[") && !payloadText.includes("\"candles\": [{"));
const payloadWithoutMarket = S.buildAgentPayload(agentDrafts, defaults, S.RANKINGS, [], null, "x");
ok("an unavailable market is sent as null, not fabricated", payloadWithoutMarket.market === null);
ok("the agent payload carries no credential field", !/apiKey|authorization|token|secret/i.test(payloadText));

const tickers = S.parseMarketTickers({ at: 1, rows: [{ symbol: "BNBUSDT", price: 300.5, changePercent: 1.25, volume: 10, quoteVolume: 3000, at: 1 }] });
ok("ticker rows parse into the panel shape", tickers.length === 1 && tickers[0].price === 300.5 && tickers[0].changePercent === 1.25);
ok("a malformed ticker row is rejected", (() => { try { S.parseMarketTickers({ rows: [{ symbol: "X" }] }); return false; } catch { return true; } })());
const klines = S.parseMarketKlines({ symbol: "BNBUSDT", interval: "1h", at: 2, candles: [{ t: 1, o: 1, h: 2, l: 0.5, c: 1.5, v: 10 }], summary: { candles: 1 } });
ok("kline payload keeps the summary and drops nothing needed", klines.symbol === "BNBUSDT" && klines.count === 1 && klines.summary.candles === 1);

/* ---- 回测：只用真实 K 线，结果可复核 ---- */
function makeCandles(prices, volumes) {
	return prices.map((price, index) => ({ t: 1700000000000 + index * 3600000, o: price, h: price * 1.01, l: price * 0.99, c: price, v: volumes === undefined ? 100 : volumes[index] }));
}
const flatCandles = makeCandles(Array.from({ length: 30 }, (_, index) => 100));
const risingCandles = makeCandles(Array.from({ length: 40 }, (_, index) => (index < 22 ? 100 : 100 + (index - 21) * 2)));
const fallingCandles = makeCandles(Array.from({ length: 40 }, (_, index) => (index < 22 ? 100 : 100 - (index - 21) * 1)));
const btDefault = S.createDefaultConfigs();
const btFlat = S.runBacktest(btDefault, [{ symbol: "BNBUSDT", candles: flatCandles }]);
ok("a flat market produces zero trades (no invented activity)", btFlat.ok === true && btFlat.results.every((row) => row.trades === 0 && row.netPnl === 0 && row.winRate === null), JSON.stringify(btFlat.results));
const btRise = S.runBacktest(btDefault, [{ symbol: "BNBUSDT", candles: risingCandles }]);
ok("an SMA cross enters a trade and reports a positive result", btRise.ok === true && btRise.results[0].trades >= 1 && btRise.results[0].netPnl > 0, JSON.stringify(btRise.results[0]));
const btFall = S.runBacktest(btDefault, [{ symbol: "BNBUSDT", candles: fallingCandles }]);
ok("a falling market never yields a positive best trade", btFall.ok === true && btFall.results.every((row) => row.best === null || row.best <= 0), JSON.stringify(btFall.results));
ok("no klines means a visible backtest failure", S.runBacktest(btDefault, []).ok === false);
const drift = S.liveDrift(btRise, [{ symbol: "BNBUSDT", price: 104, changePercent: 1, volume: 1, quoteVolume: 1, at: 1 }], [{ symbol: "BNBUSDT", candles: risingCandles }]);
ok("live drift is the change since the last backtest close", drift[0].drift !== null && Math.abs(drift[0].drift - ((104 / risingCandles.at(-1).c - 1) * 100)) < 0.01, JSON.stringify(drift));

console.log(fail.length === 0 ? "\nALL PASS" : "\nFAILURES (" + fail.length + "): " + fail.join(" | "));
if (fail.length > 0) process.exitCode = 1;
