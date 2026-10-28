import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
const root = "D:/Programs/DSH Desktop Beta/resources/app/node_modules/@deepseek-ai";
const terms = ["truncate", "rewind", "deleteEvent", "replaceMessage", "editMessage", "resend", "branchFrom"];
const hits = new Map();
function walk(dir, depth = 0) {
  if (depth > 3) return;
  let entries = [];
  try { entries = readdirSync(dir, { withFileTypes: true }); } catch { return; }
  for (const e of entries) {
    const p = join(dir, e.name);
    if (e.isDirectory()) { walk(p, depth + 1); continue; }
    if (!e.name.endsWith(".js")) continue;
    let text = "";
    try { text = readFileSync(p, "utf8"); } catch { continue; }
    for (const t of terms) if (text.includes(t)) {
      const key = t + " :: " + p.split("@deepseek-ai/")[1];
      if (!hits.has(key)) {
        const i = text.indexOf(t);
        hits.set(key, text.slice(Math.max(0, i - 100), i + 120).replace(/\s+/g, " "));
      }
    }
  }
}
walk(root);
for (const [k, v] of [...hits].slice(0, 12)) console.log(k, "\n  ", v.slice(0, 220), "\n");
