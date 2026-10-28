#!/usr/bin/env node
/**
 * Restore the unpatched workspace-UI bundle from the pristine copy kept next to
 * this script.
 *
 * `client.js.orig` is the untouched 2.0.18-beta.1 bundle; `client.js` is the same
 * file with the hide-workspace edits applied. Copying the former over the
 * installed file is the whole revert — no pattern matching, so it cannot leave a
 * half-patched file behind. A target that does not contain the patch markers is
 * refused, because that means the app was updated and this archive belongs to a
 * different release.
 */
import { copyFileSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const target = process.argv[2];
if (!target) {
	console.error("usage: node revert.mjs <path to dsh-client-ui-workspace/lib/client.js>");
	process.exit(2);
}

const current = readFileSync(target, "utf8");
if (!current.includes("hdy-workspace-toolbar") && !current.includes("hide.workspace")) {
	console.error("target does not look patched; nothing to revert:", target);
	process.exit(1);
}

const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const backup = join(here, `client.js.patched-${stamp}`);
copyFileSync(target, backup);
copyFileSync(join(here, "client.js.orig"), target);
const restored = readFileSync(target, "utf8");
if (restored.includes("hdy-workspace-toolbar") || restored.includes("hide.workspace")) {
	writeFileSync(target, current);
	console.error("restored file still carries patch markers; the patched file was put back");
	process.exit(1);
}
console.log("restored:", target);
console.log("backup of the patched file:", backup);
