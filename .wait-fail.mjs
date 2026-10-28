import { readFileSync, writeFileSync } from "node:fs";
const target = "D:/codexApp/hdy-plugin/verify/browser-check.mjs";
let text = readFileSync(target, "utf8");
text = text.replace('marketMode = "fail";\n\tawait page.waitForTimeout(3000);', 'marketMode = "fail";\n\tawait page.waitForTimeout(5000);');
writeFileSync(target, text);
console.log("wait updated");
