/** 30 秒观察行情状态是否稳定（不 mock）。 */
import { createRequire } from "node:module";
import { readFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
const here = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const { chromium } = require("D:/codexApp/mytv/node_modules/playwright");
const url = JSON.parse(await readFile(join(here, "..", ".dev/instance.json"), "utf8")).url;
const browser = await chromium.launch({ headless: true, executablePath: "C:/Users/root/AppData/Local/ms-playwright/chromium_headless_shell-1248/chrome-headless-shell-win64/chrome-headless-shell.exe" });
const page = await browser.newPage({ viewport: { width: 1440, height: 960 } });
await page.goto(url, { waitUntil: "domcontentloaded" });
await page.waitForSelector("[aria-label='策略管理']");
const notice = page.locator("[role=dialog][aria-label='Preview Notice']");
if (await notice.count() > 0) { await notice.getByRole("button", { name: "Continue" }).click(); await page.waitForTimeout(300); }
await page.click("[aria-label='策略管理']");
await page.waitForSelector("[data-backtest='done']", { timeout: 30000 });
const states = [];
for (let index = 0; index < 30; index += 1) {
	const strip = await page.locator("[data-market='strip']").innerText();
	states.push(strip.includes("● 实时") ? "live" : strip.includes("断开") ? "down" : "connecting");
	await page.waitForTimeout(1000);
}
const counts = states.reduce((acc, value) => (acc[value] = (acc[value] ?? 0) + 1, acc), {});
console.log(JSON.stringify({ counts, sequence: states.join("") }));
await browser.close();
