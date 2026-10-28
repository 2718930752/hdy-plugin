import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
const root = "C:/Users/root/.dsh-beta/profiles/desk2.05/node_modules";
const out = [];
function walk(dir, depth = 0) {
  if (depth > 3) return;
  let entries = [];
  try { entries = readdirSync(dir, { withFileTypes: true }); } catch { return; }
  for (const e of entries) {
    const p = join(dir, e.name);
    if (e.isDirectory()) { if (e.name !== ".bin" && e.name !== ".pnpm") walk(p, depth + 1); continue; }
    if (e.name !== "client.js") continue;
    let text = "";
    try { text = readFileSync(p, "utf8"); } catch { continue; }
    if (/MessageIconActions|conversation\.chat\.user|message\.actions/.test(text)) out.push(p.replace(root + "\\", ""));
  }
}
walk(root);
console.log(out.slice(0, 20).join("\n"));
