/**
 * 真实运行实例的秒级核对：面板显示 vs 交易所直连，连续 10 个采样点。
 * 不 mock 任何请求。
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

async function exchangePrice(symbol) {
	const response = await fetch("https://data-api.binance.vision/api/v3/ticker/price?symbol=" + symbol);
	assert.equal(response.status, 200, "binance ticker/price");
	return Number((await response.json()).price);
}

const browser = await chromium.launch({ headless: true, executablePath: process.env.DSH_CHROMIUM ?? "C:/Users/root/AppData/Local/ms-playwright/chromium_headless_shell-1248/chrome-headless-shell-win64/chrome-headless-shell.exe" });
const result = { samples: [], checks: [], failures: [] };
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
	await page.waitForSelector("[data-backtest='done']", { timeout: 30000 });

	const rankCount = await page.locator(".hdy-rank").count();
	const rankText = await page.locator(".hdy-rank").first().innerText();
	const cardText = await page.locator(".hdy-card").first().innerText();
	check("ranking cards are backtest output", rankCount === 3 && /[+-]?\d+\.\d{4} BNB/.test(rankText) && rankText.includes("回测口径"), rankText.replace(/\n/g, " | "));
	check("card metrics are labelled 回测 / 实时", cardText.includes("（回测）") && cardText.includes("实时偏离"), cardText.replace(/\n/g, " | "));

	for (let index = 0; index < 10; index += 1) {
		const strip = await page.locator("[data-market='strip']").innerText();
		const match = strip.match(/BNBUSDT\s+([0-9]+(?:\.[0-9]+)?)/);
		const displayed = match === null ? null : Number(match[1]);
		const time = (strip.match(/更新 (\d{2}:\d{2}:\d{2})/) ?? [])[1] ?? null;
		const live = strip.includes("● 实时");
		const real = await exchangePrice("BNBUSDT");
		const diffPercent = displayed === null ? null : Math.abs(displayed - real) / real * 100;
		result.samples.push({ index: index + 1, at: new Date().toISOString(), displayed, real, diffPercent, time, live });
		check("sample " + (index + 1) + " matches exchange", displayed !== null && diffPercent < 0.5 && live, JSON.stringify({ displayed, real, time }));
		await page.waitForTimeout(1000);
	}
	const times = new Set(result.samples.map((sample) => sample.time).filter(Boolean));
	check("the update time advances during the run", times.size >= 5, JSON.stringify([...times]));
	await page.screenshot({ path: join(here, "artifacts", "live-market.png"), fullPage: true });
	await context.close();
	await writeFile(join(here, "artifacts", "live-market.json"), JSON.stringify({ at: new Date().toISOString(), ...result }, null, 2));
} finally {
	await browser.close();
}
console.log("\n" + (result.failures.length === 0 ? "ALL PASS (" + result.checks.length + ")" : "FAILURES: " + JSON.stringify(result.failures.slice(0, 3))));
if (result.failures.length > 0) process.exitCode = 1;
