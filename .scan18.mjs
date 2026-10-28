import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
const root = "D:/Programs/DSH Desktop Beta/resources/app/node_modules/@deepseek-ai";
const out = new Map();
function walk(dir, depth = 0) {
  if (depth > 2) return;
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) { walk(p, depth + 1); continue; }
    if (e.name !== "client.js") continue;
    let text = "";
    try { text = readFileSync(p, "utf8"); } catch { continue; }
    for (const t of ["super(ctx, \"chat\")", "\"chat\":", "useChat", "async submit(", "submitTurn("]) {
      if (text.includes(t) && !out.has(t)) {
        const i = text.indexOf(t);
        out.set(t, p.split("@deepseek-ai/")[1] + " :: " + text.slice(Math.max(0, i - 140), i + 160).replace(/\s+/g, " "));
      }
    }
  }
}
walk(root);
for (const [k, v] of out) console.log(k, "\n  ", v.slice(0, 260), "\n");
