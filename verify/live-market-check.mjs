/**
 * 真实运行实例里的行情核对：面板显示 vs 交易所直连。
 * 不 mock 任何请求；用真实 dev 实例 + 币安公开接口对照。
 */
import { createRequire } from "node:module";
import { readFile, writeFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";

const here = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.DSH_PLAYWRIGHT ?? "D:/codexApp/mytv/node_modules/playwright");
const url = JSON.parse(await readFile(join(here, "..", ".dev/instance.json"), "utf8")).url;
const symbols = ["BNBUSDT", "BTCUSDT", "ETHUSDT"];

async function exchangePrices() {
	const query = encodeURIComponent(JSON.stringify(symbols));
	const response = await fetch("https://data-api.binance.vision/api/v3/ticker/24hr?symbols=" + query);
	assert.equal(response.status, 200, "binance ticker");
	const rows = await response.json();
	return Object.fromEntries(rows.map((row) => [row.symbol, Number(row.lastPrice)]));
}

const browser = await chromium.launch({ headless: true, executablePath: process.env.DSH_CHROMIUM ?? "C:/Users/root/AppData/Local/ms-playwright/chromium_headless_shell-1248/chrome-headless-shell-win64/chrome-headless-shell.exe" });
const result = { checks: [], failures: [] };
const check = (label, condition, detail) => {
	(condition ? result.checks : result.failures).push({ label, detail });
	console.log((condition ? "PASS " : "FAIL ") + label + (condition || detail === undefined ? "" : " -> " + detail));
};
try {
	const context = await browser.newContext({ viewport: { width: 1440, height: 960 } });
	const page = await context.newPage();
	await page.goto(url, { waitUntil: "domcontentloaded" });
	await page.waitForSelector("[aria-label='策略管理']", { timeout: 30000 });
	const notice = page.locator("[role=dialog][aria-label='Preview Notice']");
	if (await notice.count() > 0) {
		await notice.getByRole("button", { name: "Continue" }).click();
		await page.waitForTimeout(300);
	}
	await page.click("[aria-label='策略管理']");
	await page.waitForSelector("[data-market='strip'] .hdy-market-row", { timeout: 20000 });

	const strip1 = await page.locator("[data-market='strip']").innerText();
	const shown = {};
	for (const symbol of symbols) {
		const match = strip1.match(new RegExp(symbol + "\\s+([0-9]+(?:\\.[0-9]+)?)"));
		if (match) shown[symbol] = Number(match[1]);
	}
	const exchange1 = await exchangePrices();
	for (const symbol of symbols) {
		const displayed = shown[symbol];
		const real = exchange1[symbol];
		check("displayed " + symbol + " matches exchange", displayed !== undefined && Math.abs(displayed - real) / real < 0.005, JSON.stringify({ displayed, real }));
	}
	check("strip is labelled live", strip1.includes("● 实时") && strip1.includes("Binance 现货"), strip1.replace(/\n/g, " | "));
	const time1 = (strip1.match(/更新 (\d{2}:\d{2}:\d{2})/) ?? [])[1] ?? null;
	check("strip shows the update time", time1 !== null, strip1.replace(/\n/g, " | "));

	const history = await page.locator("[data-market='history']").innerText().catch(() => "");
	check("7d history summary is real and rendered", history.includes("近 7 天 1h") && history.includes("涨跌") && history.includes("波动"), history.replace(/\n/g, " | "));

	await page.waitForTimeout(16000);
	const strip2 = await page.locator("[data-market='strip']").innerText();
	const time2 = (strip2.match(/更新 (\d{2}:\d{2}:\d{2})/) ?? [])[1] ?? null;
	check("panel auto-refreshes within the poll interval", time2 !== null && time2 !== time1, JSON.stringify({ time1, time2 }));
	const exchange2 = await exchangePrices();
	const shown2 = {};
	for (const symbol of symbols) {
		const match = strip2.match(new RegExp(symbol + "\\s+([0-9]+(?:\\.[0-9]+)?)"));
		if (match) shown2[symbol] = Number(match[1]);
	}
	for (const symbol of symbols) {
		const displayed = shown2[symbol];
		const real = exchange2[symbol];
		check("refreshed " + symbol + " still matches exchange", displayed !== undefined && Math.abs(displayed - real) / real < 0.005, JSON.stringify({ displayed, real }));
	}
	await page.screenshot({ path: join(here, "artifacts", "live-market.png"), fullPage: true });
	await context.close();
	await writeFile(join(here, "artifacts", "live-market.json"), JSON.stringify({ at: new Date().toISOString(), strip1, strip2, exchange1, exchange2, ...result }, null, 2));
} finally {
	await browser.close();
}
console.log("\n" + (result.failures.length === 0 ? "ALL PASS (" + result.checks.length + ")" : "FAILURES: " + JSON.stringify(result.failures)));
if (result.failures.length > 0) process.exitCode = 1;
