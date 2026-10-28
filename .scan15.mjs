import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
const root = "D:/Programs/DSH Desktop Beta/resources/app/node_modules/@deepseek-ai";
function walk(dir, depth = 0) {
  if (depth > 2) return;
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) { walk(p, depth + 1); continue; }
    if (e.name !== "client.js") continue;
    let text = "";
    try { text = readFileSync(p, "utf8"); } catch { continue; }
    if (text.includes("conversation.chat.user.content")) {
      const i = text.indexOf("conversation.chat.user.content");
      console.log("FILE", p.split("@deepseek-ai/")[1]);
      console.log(text.slice(Math.max(0, i - 900), i + 900).replace(/\n/g, "\n").slice(0, 1800));
    }
  }
}
walk(root);
