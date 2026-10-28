#!/usr/bin/env node
/**
 * Reverse the "hide workspace" patch in a target workspace-UI bundle.
 *
 * The patch is a fixed set of insertions, so the inverse is a fixed set of
 * removals. Every pattern must match exactly once; a miss aborts without
 * writing, so a bundle from another DSH release is left untouched.
 */
import { readFileSync, writeFileSync } from "node:fs";

const target = process.argv[2];
if (!target) {
	console.error("usage: node revert.mjs <path to dsh-client-ui-workspace/lib/client.js>");
	process.exit(2);
}

/** Each entry: [startMarker, endMarkerOrNull, replacement]. */
const EDITS = [
	[
		`		/** Workspace ids hidden from the sidebar: browser-local, survives reloads. */`,
		`		}
		/** Build one group without projecting session lineage into presentation. */`,
		`		/** Build one group without projecting session lineage into presentation. */`
	],
	["function deriveGroups(list, workspaces, rowState, statuses, view, hiddenWorkspaceIds) {", null, "function deriveGroups(list, workspaces, rowState, statuses, view) {"],
	[
		`				/* Hidden Workspaces stay accounted (their sessions never leak into Ungrouped); only the section is skipped. */`,
		`				const expanded = expandedGroups.has(g.key);`,
		`				const expanded = expandedGroups.has(g.key);`
	],
	[", shortcuts, hiddenWorkspaceIds, onToggleWorkspaceHidden }) {", null, ", shortcuts }) {"],
	[
		`			}, hiddenWorkspaceIds), [`,
		null,
		`			}), [`
	],
	[
		`				ungroupedSessionIds,
				hiddenWorkspaceIds
			]);`,
		null,
		`				ungroupedSessionIds
			]);`
	],
	[
		`								hide: () => {
									/* v8 ignore next -- narrowing guard: the actions object exists only for real-workspace groups. */
									if (group.workspaceId !== void 0) onToggleWorkspaceHidden?.(group.workspaceId);
								}
`,
		null,
		""
	],
	[
		`				id: "hide",
				label: t("hide.workspace")
			}, {
`,
		null,
		""
	],
	[
		`								/* v8 ignore next -- Menu can emit only the hide, rename and delete rows supplied above. */
								if (id !== "hide" && id !== "rename" && id !== "delete") return;
								if (id === "hide") actions.hide();
								else if (id === "rename") actions.rename();
`,
		null,
		`								/* v8 ignore next -- Menu can emit only the rename and delete rows supplied above. */
								if (id !== "rename" && id !== "delete") return;
								if (id === "rename") actions.rename();
`
	],
	[
		'			/** Workspaces the user hid from this browser; `showHidden` reveals them again. */',
		'			const guardedOpen = (sessionId) => {',
		'			const guardedOpen = (sessionId) => {'
	],
	[
		`			/** Sessions of hidden Workspaces stay out of the flat list too. */`,
		`			const orderedWorkspaces = (0, react.useMemo)(`,
		`			const orderedWorkspaces = (0, react.useMemo)(`
	],
	["sessionIds: orderedFlatSessionIds.filter((id) => !hiddenSessionIds.has(id)),", null, "sessionIds: orderedFlatSessionIds,"],
	[
		`							hiddenWorkspaceIds: effectiveHiddenWorkspaceIds,
							onToggleWorkspaceHidden: toggleWorkspaceHidden,
`,
		null,
		""
	],
	[
		`								children: [hiddenWorkspaceIds.size > 0 && (0, react_jsx_runtime.jsx)("button", {`,
		`								}), wide && (0, react_jsx_runtime.jsx)(ViewOptionsMenu, {`,
		`								children: [wide && (0, react_jsx_runtime.jsx)(ViewOptionsMenu, {`
	],
	[`			"hide.workspace": "隐藏工作区",
			"hidden.show": "已隐藏 {n}",
			"hidden.hide": "隐藏中 {n} · 点击显示",
`, null, ""],
	[`			"hide.workspace": "Hide workspace",
			"hidden.show": "{n} hidden",
			"hidden.hide": "{n} hidden · click to show",
`, null, ""]
];

let text = readFileSync(target, "utf8");
for (const [start, end, replacement] of EDITS) {
	const from = text.indexOf(start);
	if (from === -1) {
		console.error("start marker not found; refusing to write:", start.split("\n")[0].trim().slice(0, 70));
		process.exit(1);
	}
	let to;
	if (end === null) {
		to = from + start.length;
	} else {
		const at = text.indexOf(end, from + start.length);
		if (at === -1) {
			console.error("end marker not found; refusing to write:", start.split("\n")[0].trim().slice(0, 70));
			process.exit(1);
		}
		to = at + end.length;
	}
	text = text.slice(0, from) + replacement + text.slice(to);
}
writeFileSync(target, text);
console.log("reverted:", target);
