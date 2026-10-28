import { readFileSync, writeFileSync } from "node:fs";
const target = "D:/codexApp/hdy-plugin/lib/client.js";
let text = readFileSync(target, "utf8");
text = text.replace("var failures = 0;", "var failures = 0;\n\t\t\t\tvar hasData = false;");
text = text.replace('var rows = parseMarketTickers(payload);', 'var rows = parseMarketTickers(payload);\n\t\t\t\t\t\thasData = rows.length > 0;');
text = text.replace("var hasRows = market.rows.length > 0;", "var hasRows = hasData;");
writeFileSync(target, text);
console.log("hasData wired");
