import { readFileSync, writeFileSync } from "node:fs";
const target = "D:/codexApp/hdy-plugin/lib/client.js";
let text = readFileSync(target, "utf8");
const startMarker = "failures += 1;";
const start = text.indexOf(startMarker);
if (start === -1) throw new Error("failure block missing");
const endMarker = "backoff = backoff === 0 ? 2000 : Math.min(30000, backoff * 2);";
const end = text.indexOf(endMarker, start);
if (end === -1) throw new Error("backoff missing");
const endFull = end + endMarker.length + "\n\t\t\t\t\t\t}".length;
const replacement = [
	"failures += 1;",
	"\t\t\t\t\t\t/** 超时/中止不当作断线：数据仍可能是上一秒的真实值。 */",
	"\t\t\t\t\t\tvar friendly = error !== null && error !== void 0 && (error.name === \"AbortError\" || /abort/i.test(String(error.message))) ? \"行情响应超时，正在重试\" : error instanceof Error ? error.message : String(error);",
	"\t\t\t\t\t\tvar hasRows = market.rows.length > 0;",
	"\t\t\t\t\t\tif (failures >= 3) {",
	"\t\t\t\t\t\t\tsetMarket(function(previous) { return { status: \"error\", rows: previous.rows, at: previous.at, error: friendly }; });",
	"\t\t\t\t\t\t\tbackoff = backoff === 0 ? 2000 : Math.min(30000, backoff * 2);",
	"\t\t\t\t\t\t} else if (!hasRows) {",
	"\t\t\t\t\t\t\tsetMarket(function(previous) { return { status: \"connecting\", rows: previous.rows, at: previous.at, error: \"\" }; });",
	"\t\t\t\t\t\t}"
].join("\n");
text = text.slice(0, start) + replacement + text.slice(endFull);
writeFileSync(target, text);
console.log("soft errors patched");
