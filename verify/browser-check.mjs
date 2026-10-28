/**
 * 策略管理页在真实 DSH 实例里的浏览器验收。
 *
 * 用法（无需参数）：node verify/browser-check.mjs
 * 目标地址默认读 .dev/instance.json；可用 DSH_URL 覆盖。
 * 浏览器默认可执行文件来自 DSH_PLAYWRIGHT / DSH_CHROMIUM，缺省为本机已装的 Playwright。
 */
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");
const require = createRequire(import.meta.url);
const playwrightPath = process.env.DSH_PLAYWRIGHT ?? "D:/codexApp/mytv/node_modules/playwright";
const chromiumPath = process.env.DSH_CHROMIUM ?? "C:/Users/root/AppData/Local/ms-playwright/chromium_headless_shell-1248/chrome-headless-shell-win64/chrome-headless-shell.exe";
const { chromium } = require(playwrightPath);

let url = process.env.DSH_URL;
if (!url) {
	const statePath = join(root, ".dev/instance.json");
	if (!existsSync(statePath)) throw new Error("no running dev instance; run: pwsh -File ./dev.ps1 -Action start");
	url = JSON.parse(await readFile(statePath, "utf8")).url;
}

const out = join(here, "artifacts");
await mkdir(out, { recursive: true });
const passed = [];
const failures = [];
const consoleErrors = [];
const check = (label, condition, detail) => {
	if (condition) passed.push(label);
	else failures.push(label + (detail === void 0 ? "" : " :: " + detail));
	console.log((condition ? "PASS " : "FAIL ") + label + (condition || detail === void 0 ? "" : " -> " + detail));
};

/** The host shows first-run notices on a fresh profile; they mask the whole page. */
async function dismissHostNotices(page) {
	const dialog = page.locator("[role=dialog][aria-label='Preview Notice']");
	try {
		await dialog.waitFor({ state: "visible", timeout: 4000 });
	} catch {
		return;
	}
	await dialog.getByRole("button", { name: "Continue" }).click();
	await page.waitForTimeout(300);
}


/** 行情 + AI 建议：全部走本机路由 mock，不发真实网络请求。 */
async function marketAndAgentPhase(browser, url, check, dismissHostNotices, out) {
	const context = await browser.newContext({ viewport: { width: 1280, height: 960 }, acceptDownloads: true });
	const page = await context.newPage();
	const requests = { ticker: 0, klines: 0, suggest: 0 };
	const suggestPayloads = [];
	let marketMode = "ok";
	let modelMode = "ok";
	const now = Date.now();
	const tickerBody = () => JSON.stringify({ at: now, cached: false, rows: [
		{ symbol: "BNBUSDT", price: 301.25, changePercent: 1.5, volume: 10, quoteVolume: 3000, at: now },
		{ symbol: "BTCUSDT", price: 61234.5, changePercent: -0.8, volume: 20, quoteVolume: 9000, at: now }
	] });
	let klinesBody = () => JSON.stringify({ symbol: "BNBUSDT", interval: "1h", at: now, count: 168, candles: [{ t: 1, o: 1, h: 2, l: 0.5, c: 1.5, v: 10 }], summary: { symbol: "BNBUSDT", interval: "1h", candles: 168, changePercent: 4.2, volatilityPercent: 0.8, high: 310, low: 280, volumeChangePercent: 12 } });
	await page.route("**/strategy/market/ticker*", async (route) => {
		requests.ticker += 1;
		if (marketMode === "fail") return route.fulfill({ status: 502, contentType: "application/json", body: JSON.stringify({ code: "market-unavailable", message: "行情暂不可用：mock" }) });
		return route.fulfill({ status: 200, contentType: "application/json", body: tickerBody() });
	});
	await page.route("**/strategy/market/klines*", async (route) => {
		requests.klines += 1;
		if (marketMode === "fail") return route.fulfill({ status: 502, contentType: "application/json", body: JSON.stringify({ code: "market-unavailable", message: "历史行情暂不可用：mock" }) });
		return route.fulfill({ status: 200, contentType: "application/json", body: klinesBody() });
	});
	await page.route("**/strategy/suggest", async (route) => {
		requests.suggest += 1;
		suggestPayloads.push(JSON.parse(route.request().postData() ?? "{}"));
		if (modelMode === "fail") return route.fulfill({ status: 502, contentType: "application/json", body: JSON.stringify({ code: "model-failure", message: "模型调用失败：mock" }) });
		return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({
			ok: true,
			model: "mock/model",
			usedMarket: marketMode !== "fail",
			suggestions: [
				{ strategyId: "A", field: "maxBuyTax", value: 9.5, reason: "BNB 24h 振幅 1.5%，放宽税率摩擦", impact: "提高成交率" },
				{ strategyId: "D", field: "stopLossPercent", value: -30, reason: "区间波动率 0.8%，收紧止损", impact: "降低单笔回撤" },
				{ strategyId: "E", field: "maxBuyTax", value: 101, reason: "越界样例", impact: "应被拒绝" }
			]
		}) });
	});
	await page.goto(url, { waitUntil: "domcontentloaded" });
	await page.waitForSelector("[aria-label='策略管理']", { timeout: 30000 });
	await dismissHostNotices(page);
	await page.click("[aria-label='策略管理']");
	await page.waitForSelector(".hdy-strategy");
	await page.waitForSelector("[data-market='strip'] .hdy-market-row", { timeout: 15000 });

	/* 6. 实时行情解析与展示 */
	const strip = await page.locator("[data-market='strip']").innerText();
	check("market strip shows the mocked price and live state", strip.includes("301.25") && strip.includes("+1.50%") && strip.includes("● 实时"), strip);
	check("market strip shows the updated time", /更新 \d{2}:\d{2}:\d{2}/.test(strip), strip);

	/* 1/2/3/4. 建议生成、校验、应用与放弃 */
	await page.getByRole("button", { name: "AI 参数建议" }).click();
	await page.waitForSelector("[role=dialog]");
	await page.fill(".hdy-agent-input", "降低 A 策略的风险");
	await page.getByRole("button", { name: "生成建议" }).click();
	await page.waitForSelector(".hdy-agent-row", { timeout: 15000 });
	const acceptedRows = await page.locator(".hdy-agent-row").count();
	const rejectedText = await page.locator(".hdy-agent-rejected").innerText();
	check("valid suggestions appear, invalid one is rejected with a reason", acceptedRows === 2 && rejectedText.includes("不能大于"), JSON.stringify({ acceptedRows, rejectedText }));
	check("dialog states that market data was used", (await page.locator(".hdy-agent-result").innerText()).includes("已使用行情摘要"));
	const storageBeforeApply = await page.evaluate(() => localStorage.getItem("strategy-dashboard.config.v1"));
	/* 9. 请求载荷：含行情摘要，不含原始 K 线或密钥 */
	const sent = suggestPayloads.at(-1);
	check("agent request carries the market summary but no raw candles", JSON.stringify(sent.market).includes("volatilityPercent") && !JSON.stringify(sent).includes("\"candles\":[") && !/apiKey|token|secret/i.test(JSON.stringify(sent)));
	const firstRowValue = await page.locator(".hdy-agent-row").first().innerText();
	check("diff row reads 原值 → 建议值", firstRowValue.includes("8 → 9.5"), firstRowValue);
	await page.locator(".hdy-agent-row input[type=checkbox]").nth(1).uncheck();
	await page.getByRole("button", { name: "应用所选" }).click();
	await page.waitForTimeout(150);
	check("partial apply changes only the chosen field", await page.inputValue("#hdy-field-A-maxBuyTax") === "9.5" && await page.inputValue("#hdy-field-D-stopLossPercent") === "-50");
	check("apply writes the draft only, storage unchanged", await page.evaluate(() => localStorage.getItem("strategy-dashboard.config.v1")) === storageBeforeApply);
	await page.reload({ waitUntil: "domcontentloaded" });
	await dismissHostNotices(page);
	await page.click("[aria-label='策略管理']");
	await page.waitForSelector(".hdy-strategy");
	check("reload returns to the saved value after an unsaved apply", await page.inputValue("#hdy-field-A-maxBuyTax") === "8");

	/* 4. 放弃不改草稿 */
	await page.fill("#hdy-field-A-maxSellTax", "11");
	await page.getByRole("button", { name: "AI 参数建议" }).click();
	await page.waitForSelector("[role=dialog]");
	await page.fill(".hdy-agent-input", "再给一版");
	await page.getByRole("button", { name: "生成建议" }).click();
	await page.waitForSelector(".hdy-agent-row", { timeout: 15000 });
	await page.getByRole("button", { name: "放弃" }).click();
	await page.waitForTimeout(100);
	check("discard leaves the draft untouched", await page.inputValue("#hdy-field-A-maxBuyTax") === "8" && await page.inputValue("#hdy-field-A-maxSellTax") === "11");

	/* 5. 模型失败：错误提示，草稿不变 */
	modelMode = "fail";
	await page.getByRole("button", { name: "AI 参数建议" }).click();
	await page.waitForSelector("[role=dialog]");
	await page.fill(".hdy-agent-input", "失败样例");
	await page.getByRole("button", { name: "生成建议" }).click();
	await page.waitForSelector(".hdy-dialog-error", { timeout: 15000 });
	check("model failure is reported and the draft is untouched", (await page.locator(".hdy-dialog-error").innerText()).includes("模型调用失败") && await page.inputValue("#hdy-field-A-maxSellTax") === "11");
	await page.getByRole("button", { name: "放弃" }).click();
	modelMode = "ok";

	/* 8. 行情失败：页面提示，功能不受影响，建议标注未使用行情 */
	marketMode = "fail";
	await page.waitForTimeout(16000);
	const failedStrip = await page.locator("[data-market='strip']").innerText();
	check("market failure is shown without breaking the page", failedStrip.includes("断开") || failedStrip.includes("不可用"), failedStrip);
	await page.fill("#hdy-field-A-buyPercent", "3");
	await page.locator(".hdy-card").nth(0).locator("button[type=submit]").click();
	await page.waitForTimeout(150);
	check("saving still works while the market is down", await page.evaluate(() => JSON.parse(localStorage.getItem("strategy-dashboard.config.v1")).configs[0].parameters.buyPercent) === 3);
	await page.getByRole("button", { name: "AI 参数建议" }).click();
	await page.waitForSelector("[role=dialog]");
	await page.fill(".hdy-agent-input", "行情失败的样例");
	await page.getByRole("button", { name: "生成建议" }).click();
	await page.waitForSelector(".hdy-agent-result", { timeout: 15000 });
	check("agent result marks that market data was not used", (await page.locator(".hdy-agent-result").innerText()).includes("未使用行情数据"));
	await page.getByRole("button", { name: "放弃" }).click();

	/* 6. 重连 */
	marketMode = "ok";
	await page.waitForTimeout(17000);
	const recovered = await page.locator("[data-market='strip']").innerText();
	check("polling reconnects after the market recovers", recovered.includes("● 实时"), recovered);

	/* 7. 历史行情缓存命中不重复请求 */
	const klinesAfterFirst = requests.klines;
	await page.click("[aria-label='Automation tasks']").catch(async () => { await page.click("[aria-label='自动化任务']"); });
	await page.waitForTimeout(300);
	await page.click("[aria-label='策略管理']");
	await page.waitForSelector(".hdy-strategy");
	await page.waitForTimeout(800);
	check("history cache avoids a second upstream request for the same window", requests.klines === klinesAfterFirst, String(requests.klines - klinesAfterFirst));

	/* 6. 离开页面后停止轮询 */
	const tickerBeforeLeave = requests.ticker;
	await page.click("[aria-label='Automation tasks']").catch(async () => { await page.click("[aria-label='自动化任务']"); });
	await page.waitForTimeout(16000);
	check("leaving the page stops the ticker polling", requests.ticker === tickerBeforeLeave, String(requests.ticker - tickerBeforeLeave));
	await context.close();
}

const browser = await chromium.launch({ headless: true, executablePath: chromiumPath });
try {
	const context = await browser.newContext({ viewport: { width: 1440, height: 960 }, acceptDownloads: true });
	const page = await context.newPage();
	page.on("pageerror", (error) => consoleErrors.push(error.message));
	page.on("console", (message) => { if (message.type() === "error") consoleErrors.push(message.text()); });
	await page.goto(url, { waitUntil: "domcontentloaded" });
	await page.waitForSelector("[aria-label='策略管理']", { timeout: 30000 });
	await dismissHostNotices(page);

	/* 1. 首次打开：入口位置与页面内容 */
	const sidebarLabels = await page.evaluate(() => Array.from(document.querySelectorAll("[aria-label]")).map((node) => node.getAttribute("aria-label")).filter((label) => label === "策略管理" || label === "自动化任务" || label === "Automation tasks"));
	const entryIndex = sidebarLabels.indexOf("策略管理");
	const scheduleIndex = Math.max(sidebarLabels.indexOf("自动化任务"), sidebarLabels.indexOf("Automation tasks"));
	check("sidebar shows 策略管理 directly after 自动化任务", entryIndex !== -1 && scheduleIndex !== -1 && entryIndex === scheduleIndex + 1, JSON.stringify(sidebarLabels));
	await page.click("[aria-label='策略管理']");
	await page.waitForSelector(".hdy-strategy", { timeout: 15000 });
	const baseline = await page.evaluate(() => ({
		ranks: document.querySelectorAll(".hdy-rank").length,
		cards: document.querySelectorAll(".hdy-card").length,
		inputs: document.querySelectorAll(".hdy-input").length,
		switches: Array.from(document.querySelectorAll("[role=switch]")).map((node) => node.getAttribute("aria-label")),
		text: document.querySelector(".hdy-strategy").innerText
	}));
	check("4 排行 / 3 卡 / 22 输入", baseline.ranks === 4 && baseline.cards === 3 && baseline.inputs === 22, JSON.stringify({ ranks: baseline.ranks, cards: baseline.cards, inputs: baseline.inputs }));
	check("3 个开关都有策略名", baseline.switches.length === 3 && baseline.switches.every((label) => /策略 [ADE]/.test(label)), JSON.stringify(baseline.switches));
	check("演示边界文案在场", baseline.text.includes("不连接钱包") && baseline.text.includes("3.0083 BNB"));
	check("A/D 负数用文本键盘，税率为 decimal", await page.locator("#hdy-field-A-stopLossPercent").getAttribute("inputmode") === "text" && await page.locator("#hdy-field-A-maxBuyTax").getAttribute("inputmode") === "decimal");
	await page.screenshot({ path: join(out, "dashboard-1440.png"), fullPage: true });

	/* 2. 各宽度无横向溢出 */
	for (const width of [2228, 1440, 1024, 768, 390, 320]) {
		await page.setViewportSize({ width, height: 960 });
		await page.waitForTimeout(150);
		const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
		check("no horizontal overflow at " + width, overflow <= 0, String(overflow));
		if (width === 390) await page.screenshot({ path: join(out, "dashboard-390.png"), fullPage: true });
	}
	await page.setViewportSize({ width: 1440, height: 960 });

	/* 3. A=9、D=12，只保存 A；刷新后 D 回到 8 */
	await page.fill("#hdy-field-A-maxBuyTax", "9");
	await page.fill("#hdy-field-D-maxBuyTax", "12");
	await page.locator(".hdy-card").nth(0).locator("button[type=submit]").click();
	await page.waitForTimeout(100);
	const dValueAfterSingleSave = await page.inputValue("#hdy-field-D-maxBuyTax");
	check("saving A leaves D's draft untouched", dValueAfterSingleSave === "12", dValueAfterSingleSave);
	await page.reload({ waitUntil: "domcontentloaded" });
	await dismissHostNotices(page);
	await page.click("[aria-label='策略管理']");
	await page.waitForSelector(".hdy-strategy");
	check("reload restores A=9 and D=8", await page.inputValue("#hdy-field-A-maxBuyTax") === "9" && await page.inputValue("#hdy-field-D-maxBuyTax") === "8");

	/* 4. 暂停 A，全部保存，刷新后仍暂停 */
	await page.locator("[role=switch]").first().click();
	await page.getByRole("button", { name: "保存策略配置" }).first().click();
	await page.waitForTimeout(100);
	await page.reload({ waitUntil: "domcontentloaded" });
	await dismissHostNotices(page);
	await page.click("[aria-label='策略管理']");
	await page.waitForSelector(".hdy-strategy");
	check("paused state survives reload", await page.locator("[role=switch]").first().getAttribute("aria-checked") === "false");
	await page.locator("[role=switch]").first().click();
	await page.getByRole("button", { name: "保存策略配置" }).first().click();

	/* 5. 非法值 101：全部保存失败，旧值不被覆盖 */
	const beforeInvalid = await page.evaluate(() => localStorage.getItem("strategy-dashboard.config.v1"));
	await page.fill("#hdy-field-A-maxBuyTax", "101");
	await page.getByRole("button", { name: "保存策略配置" }).first().click();
	await page.waitForTimeout(150);
	check("invalid 101 is marked and blocks the save", await page.locator("#hdy-field-A-maxBuyTax").getAttribute("aria-invalid") === "true" && await page.evaluate(() => localStorage.getItem("strategy-dashboard.config.v1")) === beforeInvalid);
	check("the failure is announced", (await page.locator(".hdy-toast").innerText()).includes("失败"));

	/* 6. JSON 应用 7.5：表单变、存储不变；错 id 被拒 */
	await page.locator(".hdy-card").nth(0).getByRole("button", { name: "原始 JSON" }).click();
	await page.waitForSelector(".hdy-dialog textarea");
	const jsonText = await page.locator(".hdy-dialog textarea").inputValue();
	check("JSON reflects the current draft (invalid values stay raw text)", String(JSON.parse(jsonText).parameters.maxBuyTax) === "101", jsonText.slice(0, 120));
	await page.fill(".hdy-dialog textarea", "{bad json");
	await page.getByRole("button", { name: "应用到表单" }).click();
	check("malformed JSON shows an inline error", await page.locator(".hdy-dialog-error").isVisible());
	await page.fill(".hdy-dialog textarea", JSON.stringify({ id: "A", enabled: true, parameters: { maxBuyTax: 7.5, maxSellTax: 10, maxBuyBnb: 0.3, buyPercent: 2, stopLossPercent: -50, takeProfitMarketCap: 300000, sellAt2xPercent: 50, sellAt4xPercent: 50 } }, null, 2));
	await page.getByRole("button", { name: "应用到表单" }).click();
	await page.waitForTimeout(150);
	check("valid JSON applies 7.5 to the form", await page.inputValue("#hdy-field-A-maxBuyTax") === "7.5");
	check("JSON apply does not write storage", await page.evaluate(() => localStorage.getItem("strategy-dashboard.config.v1")) === beforeInvalid);

	/* 7. CSV 下载：文件名、BOM、19 列、3 行、当前 7.5 */
	const csvDownload = page.waitForEvent("download");
	await page.getByRole("button", { name: "导出 features.csv" }).click();
	const download = await csvDownload;
	const csvPath = join(out, "features.csv");
	await download.saveAs(csvPath);
	const csv = await readFile(csvPath, "utf8");
	const csvLines = csv.replace(/^\uFEFF/, "").trim().split(/\r\n/);
	check("CSV download keeps the filename and BOM", download.suggestedFilename() === "features.csv" && csv.charCodeAt(0) === 0xFEFF);
	check("CSV has 19 columns and 3 rows", csvLines[0].split(",").length === 19 && csvLines.length === 4, JSON.stringify(csvLines.map((line) => line.split(",").length)));
	check("CSV carries the current 7.5", csvLines[1].split(",").includes("7.5"));

	/* 8. 统计 / 复盘弹窗：Escape 关闭并回到触发器；复盘不修改配置 */
	const statsTrigger = page.getByRole("button", { name: "统计特征库" });
	await statsTrigger.click();
	await page.waitForSelector("[role=dialog]");
	check("stats dialog lists 3 strategies", (await page.locator("[role=dialog] caption").first().innerText()).includes("3 个策略"));
	await page.keyboard.press("Escape");
	await page.waitForTimeout(100);
	check("Escape closes and returns focus", (await page.locator("[role=dialog]").count()) === 0 && await page.evaluate(() => document.activeElement?.textContent?.includes("统计特征库")));
	const beforeReview = await page.evaluate(() => JSON.stringify(Array.from(document.querySelectorAll(".hdy-input")).map((node) => [node.id, node.value, node.closest(".hdy-card").querySelector("[role=switch]").getAttribute("aria-checked")])));
	await page.getByRole("button", { name: "一键智能复盘优化" }).click();
	await page.waitForSelector("[role=dialog]");
	check("review dialog shows all three strategies", (await page.locator("[role=dialog] .hdy-review").count()) === 3);
	await page.keyboard.press("Escape");
	const afterReview = await page.evaluate(() => JSON.stringify(Array.from(document.querySelectorAll(".hdy-input")).map((node) => [node.id, node.value, node.closest(".hdy-card").querySelector("[role=switch]").getAttribute("aria-checked")])));
	check("review never mutates parameters or switches", beforeReview === afterReview);

	/* 9. 离线仍可编辑与保存 */
	await context.setOffline(true);
	await page.fill("#hdy-field-A-maxBuyTax", "6");
	await page.locator(".hdy-card").nth(0).locator("button[type=submit]").click();
	await page.waitForTimeout(150);
	check("offline save still succeeds", await page.evaluate(() => JSON.parse(localStorage.getItem("strategy-dashboard.config.v1")).configs[0].parameters.maxBuyTax) === 6);
	await context.setOffline(false);

	/* 10. 损坏存储：默认值 + 警告，不覆盖原始值 */
	await page.evaluate(() => localStorage.setItem("strategy-dashboard.config.v1", "{broken"));
	await page.reload({ waitUntil: "domcontentloaded" });
	await dismissHostNotices(page);
	await page.click("[aria-label='策略管理']");
	await page.waitForSelector(".hdy-strategy");
	check("corrupted storage falls back to defaults with a warning", (await page.locator(".hdy-page-error").innerText()).includes("损坏") && await page.inputValue("#hdy-field-A-maxBuyTax") === "8");
	check("corrupted raw value is left untouched", await page.evaluate(() => localStorage.getItem("strategy-dashboard.config.v1")) === "{broken");

	/* 11. 写入失败：提示、草稿保留、不假成功 */
	await page.evaluate(() => { localStorage.setItem("strategy-dashboard.config.v1", JSON.stringify({ version: 1, configs: [] })); });
	await page.reload({ waitUntil: "domcontentloaded" });
	await dismissHostNotices(page);
	await page.click("[aria-label='策略管理']");
	await page.waitForSelector(".hdy-strategy");
	await page.evaluate(() => { const original = localStorage.setItem.bind(localStorage); window.__hdyOriginalSetItem = original; localStorage.setItem = () => { throw new Error("quota"); }; });
	await page.fill("#hdy-field-A-maxBuyTax", "4");
	await page.locator(".hdy-card").nth(0).locator("button[type=submit]").click();
	await page.waitForTimeout(150);
	const failedSave = await page.evaluate(() => ({ error: document.querySelector(".hdy-page-error")?.textContent ?? "", draft: document.querySelector("#hdy-field-A-maxBuyTax").value, saved: localStorage.getItem("strategy-dashboard.config.v1") }));
	check("write failure is reported and keeps the draft", failedSave.error.includes("保存失败") && failedSave.draft === "4", JSON.stringify(failedSave));
	check("write failure does not claim success", (await page.locator(".hdy-save-state").innerText()).includes("未保存"), await page.locator(".hdy-save-state").innerText());
	await page.evaluate(() => { localStorage.setItem = window.__hdyOriginalSetItem; });

	check("no console errors or page errors on the dashboard", consoleErrors.length === 0, JSON.stringify(consoleErrors.slice(0, 3)));

	await marketAndAgentPhase(browser, url, check, dismissHostNotices, out);
	await writeFile(join(out, "report.json"), JSON.stringify({ url, passed, failures, consoleErrors, at: new Date().toISOString() }, null, 2));
} finally {
	await browser.close();
}
console.log("\n" + (failures.length === 0 ? "ALL PASS (" + passed.length + ")" : "FAILURES (" + failures.length + "): " + failures.join(" | ")));
if (failures.length > 0) process.exitCode = 1;