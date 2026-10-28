import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import zlib from "node:zlib";
const file = "C:/Users/root/.dsh-beta/sessions/--C-Users-root-app-dsh-tooling-context-fork--/session-f106d9fc-3f21-442c-a96c-91774b1a5a16/session.jsonl.zstd";
const raw = readFileSync(file);
const text = typeof zlib.zstdDecompressSync === "function" ? zlib.zstdDecompressSync(raw).toString("utf8") : "";
console.log("decompressed bytes:", text.length);
const lines = text.split(/\r?\n/).filter(Boolean).slice(0, 200);
const seen = new Map();
for (const line of lines) {
  let event;
  try { event = JSON.parse(line); } catch { continue; }
  const type = String(event.type);
  if (seen.has(type)) continue;
  const keys = event.data && typeof event.data === "object" ? Object.keys(event.data).join(",") : "";
  seen.set(type, keys);
}
for (const [k, v] of seen) console.log(k, "|", v.slice(0, 200));
