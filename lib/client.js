window.__ModuleLoader__.load({
	id: "hdy-plugin",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let react = require("react");
		const R = typeof react.useState === "function" ? react : react.default;
		const h = R.createElement;
		const useState = R.useState;
		const useRef = R.useRef;
		const useEffect = R.useEffect;
		const useCallback = R.useCallback;
		const useMemo = R.useMemo;
		//#region styles.js
		var STYLE_ID = "dsh-prompt-polish-style";
		/**
		 * One stylesheet, injected once and shared by every occurrence. Theme tokens
		 * only, so the panel follows light/dark and the rest of the composer.
		 */
		/**
		 * 控件规范（全部走 --dsw 主题 token，浅/深色自动跟随）：
		 *   高度三档   seat 26 / 常规控件 28 / mini 24（结果区小按钮）
		 *   圆角       面板 14、控件 8、tab 组 9、tab/关闭 7
		 *   字号       面板 13、按钮/seat/tab 12、sel/meta/mini 11.5
		 *   内边距     按钮 0 12px、mini 0 8px、tab 0 10px
		 *   间距       footer gap 8、head gap 6
		 *   交互态     默认 / hover(bg-layer-2 + border-l2) / active(border-l1 当底色，
		 *              主按钮走 brightness) / disabled(opacity .45 + not-allowed + title 说明原因)
		 *              / loading(主按钮换"停止"、抽取换文案并禁用、输出区闪标) / focus-visible(品牌色描边)
		 *   防裁切     按钮 white-space:nowrap + flex:0 0 auto（永不被挤扁换行），
		 *              让 meta 文本(ellipsis)和 select(min-width 72px)去承担收缩
		 */
		var CSS = [
			".pp-seatwrap{--flame-edge:255,92,44;--flame-mid:255,158,64;--flame-core:255,243,190;position:relative;display:inline-flex;align-items:center;justify-content:center;overflow:clip;overflow-clip-margin:3px;border:1px solid rgba(var(--flame-mid),.6);border-radius:14px;background:radial-gradient(130% 170% at 50% 122%,rgb(var(--flame-edge)),rgb(var(--flame-mid)) 40%,#3a1a06 74%,#1c0c04 100%);box-shadow:0 0 9px rgba(var(--flame-mid),.5),0 0 18px rgba(var(--flame-edge),.32);transition:border-color .16s ease;animation:pp-seat-breathe 3.4s ease-in-out infinite}",
			".pp-seatwrap:hover{border-color:rgba(var(--flame-core),.9);animation-duration:1.6s}",
			".pp-seatwrap:active{filter:brightness(.82) saturate(1.2) !important}",
			".pp-seatwrap:has(.pp-seat:focus-visible){outline:2px solid rgba(var(--flame-mid),.9);outline-offset:2px}",
			".pp-seatwrap[data-open=\"1\"]{border-color:rgba(var(--flame-core),.95)}",
			".pp-seatwrap[data-busy=\"1\"]{animation:pp-seat-breathe .9s ease-in-out infinite}",
			".pp-picks{position:relative;display:inline-flex;align-items:center;gap:6px;flex:0 0 auto}",
						".pp-trigger{display:inline-flex;align-items:center;gap:4px;height:28px;max-width:min(220px,45cqw);padding:0 4px 0 8px;border:none;border-radius:var(--dsw-radius-sm,8px);background:0 0;color:var(--dsw-alias-label-secondary);font-size:13px;font-family:inherit;line-height:20px;cursor:pointer;min-width:0}",
			".pp-trigger:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover)}",
			".pp-trigger:disabled{color:var(--dsw-alias-label-dimmed);cursor:default}",
			".pp-trigger:focus-visible{box-shadow:0 0 0 2px var(--dsw-focus-ring-color,var(--dsw-alias-state-business-primary))}",
			".pp-trigger-icon{display:inline-flex;flex:none;opacity:.85}",
			".pp-trigger-label{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
			".pp-trigger-effort{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--dsw-alias-label-caption);flex-shrink:1000}",
			".pp-trigger-chevron{flex:none;color:var(--dsw-alias-label-caption);transition:transform .12s}",
			".pp-trigger[data-open=\"1\"] .pp-trigger-chevron{transform:rotate(180deg)}",
			".pp-menu{z-index:1100;display:flex;flex-direction:column;width:max-content;min-width:min(240px,calc(100vw - 32px));max-width:min(420px,calc(100vw - 32px));max-height:min(360px,calc(100vh - 96px));padding:4px;overflow:hidden;border:0;border-radius:var(--dsw-radius-lg,12px);background:var(--dsw-alias-bg-layer-1);box-shadow:var(--dsw-elevation-prominent,0 12px 32px rgba(0,0,0,.18));color:var(--dsw-alias-label-primary);animation:pp-menu-in .12s ease-out}",
			"@keyframes pp-menu-in{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}",
			".pp-cell{box-sizing:border-box;display:flex;align-items:center;gap:6px;width:auto;min-width:100%;height:34px;padding:0 8px;border:none;border-radius:var(--dsw-radius-md,8px);background:0 0;color:var(--dsw-alias-label-primary);font-size:13px;font-family:inherit;text-align:left;cursor:pointer}",
			".pp-cell:hover{background:var(--dsw-alias-interactive-bg-hover)}",
			".pp-cell-back{color:var(--dsw-alias-label-secondary)}",
			".pp-cell-label{white-space:nowrap;flex:none}",
			".pp-cell-value{margin-left:auto;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;text-align:right;color:var(--dsw-alias-label-tertiary);flex:auto}",
			".pp-cell-chevron{flex:none;color:var(--dsw-alias-menu-icon)}",
			".pp-options{display:flex;flex-direction:column;max-height:min(280px,calc(100vh - 160px));overflow:auto;padding:2px 0}",
			".pp-group{padding:6px 8px 2px;font-size:11px;color:var(--dsw-alias-label-tertiary)}",
			".pp-option{box-sizing:border-box;display:flex;align-items:center;gap:6px;width:auto;min-width:100%;min-height:34px;padding:5px 7px;border:none;border-radius:var(--dsw-radius-md,8px);background:0 0;color:inherit;font-size:13px;font-family:inherit;text-align:left;cursor:pointer}",
			".pp-option:hover{background:var(--dsw-alias-interactive-bg-hover)}",
			".pp-option[data-on=\"1\"]{background:var(--dsw-alias-interactive-bg-selected,var(--dsw-alias-bg-layer-2))}",
			".pp-option-label{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
			".pp-check{margin-left:auto;color:var(--dsw-alias-state-business-primary)}",
".pp-pick{height:24px;max-width:132px;padding:0 6px;border:1px solid var(--dsw-alias-border-l2);border-radius:7px;background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);font-size:11.5px;font-family:inherit;cursor:pointer;text-overflow:ellipsis}",
			".pp-pick:hover:not(:disabled){background:var(--dsw-alias-bg-layer-2);border-color:var(--dsw-alias-border-l1)}",
			".pp-pick:disabled{opacity:.45;cursor:not-allowed}",
			".pp-seat{position:relative;z-index:2;display:inline-flex;align-items:center;gap:5px;height:26px;padding:0 12px;border:none;border-radius:14px;background:transparent;color:#fff4e2;text-shadow:0 1px 2px rgba(60,20,0,.75);font-size:12px;font-weight:600;letter-spacing:.04em;line-height:1;cursor:pointer;font-family:inherit;white-space:nowrap}",
			".pp-seat:disabled{cursor:not-allowed;opacity:.7}",
			".pp-seat-layer{position:absolute;left:50%;top:50%;width:230%;aspect-ratio:1;pointer-events:none;z-index:1;transform:translate(-50%,-50%);opacity:.6;background:radial-gradient(closest-side,rgba(var(--flame-core),.9),rgba(var(--flame-mid),.55) 42%,transparent 72%);mix-blend-mode:screen;animation:pp-flame-a 2.3s ease-in-out infinite}",
			".pp-seat-layer:last-of-type{width:120%;top:64%;background:radial-gradient(closest-side,rgba(255,255,255,.85),rgba(var(--flame-core),.6) 34%,transparent 70%);animation:pp-flame-b 3.9s ease-in-out infinite}",
			".pp-seat-spark{position:absolute;left:8%;top:2px;width:84%;height:8px;border-radius:99px;pointer-events:none;z-index:3;opacity:.35;background:linear-gradient(180deg,rgba(var(--flame-core),.9),transparent);filter:blur(2px)}",
			"@keyframes pp-seat-breathe{0%,100%{filter:brightness(.92) saturate(1.05);box-shadow:0 0 7px rgba(var(--flame-mid),.42),0 0 15px rgba(var(--flame-edge),.28)}50%{filter:brightness(1.16) saturate(1.15);box-shadow:0 0 13px rgba(var(--flame-mid),.68),0 0 26px rgba(var(--flame-edge),.46)}}",
			"@keyframes pp-flame-a{0%,100%{opacity:.5;transform:translate(-50%,-50%) scale(1)}50%{opacity:.85;transform:translate(-50%,-50%) scale(1.12)}}",
			"@keyframes pp-flame-b{0%{opacity:.55;transform:translate(-52%,-50%) scale(.96)}50%{opacity:.9;transform:translate(-48%,-50%) scale(1.08)}100%{opacity:.55;transform:translate(-52%,-50%) scale(.96)}}",
			"@media (prefers-reduced-motion:reduce){.pp-seatwrap,.pp-seat-layer,.pp-seat-layer:last-of-type{animation:none}}",
			".pp-glyph{font-size:12px;line-height:1}",
			".pp-btn[data-on=\"1\"]{background:var(--dsw-alias-bg-layer-2);border-color:var(--dsw-alias-border-l2);color:var(--dsw-alias-label-primary);font-weight:600}",
			".pp-hist{display:flex;flex-direction:column;gap:8px}",
			".pp-hitem{border:1px solid var(--dsw-alias-border-l1);border-radius:9px;background:var(--dsw-alias-bg-layer-2);overflow:hidden}",
			".pp-hhead{display:flex;align-items:center;gap:6px;padding:7px 10px;font-size:11.5px;color:var(--dsw-alias-label-secondary);cursor:pointer;user-select:none;min-width:0}",
			".pp-hhead:hover{background:color-mix(in srgb,var(--dsw-alias-label-primary) 6%,transparent);color:var(--dsw-alias-label-primary)}",
			".pp-htime{color:var(--dsw-alias-label-primary);font-weight:600;flex:0 0 auto}",
			".pp-hwhat{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;min-width:0}",
			".pp-harrow{margin-left:auto;flex:0 0 auto}",
			".pp-hbody{padding:0 10px 8px;border-top:1px dashed var(--dsw-alias-border-l1)}",
			".pp-hlabel{font-size:11px;color:var(--dsw-alias-label-secondary);margin:8px 0 3px}",
			".pp-hpre{white-space:pre-wrap;word-break:break-word;font-size:12px;line-height:1.55;margin:0;font-family:inherit;color:var(--dsw-alias-label-primary);max-height:170px;overflow:auto;background:var(--dsw-alias-bg-base);border:1px solid var(--dsw-alias-border-l1);border-radius:7px;padding:6px 8px}",
			".pp-hrow{display:flex;gap:8px;justify-content:flex-end;margin-top:8px}",
			".pp-consent{margin:0 0 10px;padding:10px 12px;border:1px solid var(--dsw-alias-border-l2);border-radius:9px;background:var(--dsw-alias-bg-layer-2)}",
			".pp-consent p{margin:0 0 8px;font-size:12px;line-height:1.6;color:var(--dsw-alias-label-primary)}",
			".pp-consent .pp-hrow{margin-top:0}",
			".pp-usage{font-size:11.5px;color:var(--dsw-alias-label-secondary);margin:0 0 6px}",
			".pp-cmpbar{display:flex;align-items:center;gap:6px;margin:0 0 8px;min-width:0}",
			".pp-cmp{display:flex;gap:6px;align-items:stretch}",
			".pp-ccol{flex:1 1 0;min-width:0;display:flex;flex-direction:column;border:1px solid var(--dsw-alias-border-l1);border-radius:9px;background:var(--dsw-alias-bg-layer-2);overflow:hidden}",
			".pp-chead{display:flex;align-items:center;gap:4px;padding:5px 8px;font-size:11px;color:var(--dsw-alias-label-secondary);border-bottom:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-1)}",
			".pp-ctitle{font-weight:600;color:var(--dsw-alias-label-primary);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
			".pp-csize{margin-left:auto;flex:0 0 auto}",
			".pp-cbody{margin:0;padding:6px 8px;font-size:11.5px;line-height:1.55;white-space:pre-wrap;word-break:break-word;font-family:inherit;color:var(--dsw-alias-label-primary);overflow:auto;max-height:230px;flex:1 1 auto}",
			".pp-cmp[data-stack=\"1\"]{flex-direction:column}",
			".pp-cmp[data-stack=\"1\"] .pp-cbody{max-height:110px}",
			".pp-csum{margin:8px 0 0;padding:8px 10px;border:1px dashed var(--dsw-alias-border-l1);border-radius:9px;font-size:11.5px;line-height:1.7;color:var(--dsw-alias-label-secondary)}",
			".pp-csum b{color:var(--dsw-alias-label-primary);font-weight:600}",
			".pp-panel{position:fixed;z-index:1200;width:560px;max-width:calc(100vw - 24px);max-height:min(66vh,560px);display:flex;flex-direction:column;border:1px solid var(--dsw-alias-border-l1);border-radius:14px;background:var(--dsw-alias-bg-overlay);box-shadow:0 18px 48px rgba(0,0,0,.28);overflow:hidden;font-size:13px;color:var(--dsw-alias-label-primary)}",
			".pp-head{display:flex;align-items:center;gap:6px;padding:8px 10px;border-bottom:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-1);min-width:0}",
			".pp-tabs{display:inline-flex;gap:2px;padding:2px;border-radius:9px;background:var(--dsw-alias-bg-base);flex:0 0 auto}",
			".pp-tab{height:24px;padding:0 10px;border:0;border-radius:7px;background:transparent;color:var(--dsw-alias-label-secondary);font-size:12px;cursor:pointer;font-family:inherit;white-space:nowrap;transition:background .12s ease,color .12s ease}",
			".pp-tab:hover:not(:disabled):not([data-on=\"1\"]){background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary)}",
			".pp-tab:active:not(:disabled){background:var(--dsw-alias-border-l1)}",
			".pp-tab[data-on=\"1\"]{background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary);font-weight:600}",
			".pp-tab:disabled{opacity:.45;cursor:not-allowed}",
			".pp-tab:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:-2px}",
			".pp-spacer{flex:1 1 auto}",
			".pp-x{width:24px;height:24px;border:0;border-radius:7px;background:transparent;color:var(--dsw-alias-label-secondary);cursor:pointer;font-size:15px;line-height:1;flex:0 0 auto;transition:background .12s ease,color .12s ease}",
			".pp-x:hover{background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary)}",
			".pp-x:active{background:var(--dsw-alias-border-l1)}",
			".pp-x:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:-2px}",
			".pp-body{flex:1 1 auto;overflow:auto;padding:12px 14px}",
			".pp-note{color:var(--dsw-alias-label-secondary);font-size:12px;margin:0 0 8px}",
			".pp-ta{width:100%;min-height:64px;padding:8px 10px;border:1px solid var(--dsw-alias-border-l1);border-radius:9px;background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);font-size:12.5px;font-family:inherit;resize:vertical;box-sizing:border-box;outline:none;transition:border-color .12s ease}",
			".pp-ta:focus{border-color:var(--dsw-alias-brand-primary)}",
			".pp-outbar{display:flex;justify-content:flex-end;margin:0 0 6px}",
			".pp-out{white-space:pre-wrap;word-break:break-word;font-size:12.5px;line-height:1.62;margin:0;font-family:inherit;color:var(--dsw-alias-label-primary)}",
			".pp-out:empty::before{content:attr(data-placeholder);color:var(--dsw-alias-label-secondary)}",
			".pp-caret{display:inline-block;width:6px;height:14px;margin-left:2px;vertical-align:-2px;background:var(--dsw-alias-brand-primary);animation:pp-blink 1s steps(2,start) infinite}",
			"@keyframes pp-blink{to{visibility:hidden}}",
			".pp-err{padding:8px 10px;border-radius:9px;background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-state-error-primary);font-size:12px;margin-bottom:8px;white-space:pre-wrap}",
			".pp-foot{display:flex;align-items:center;gap:8px;padding:9px 12px;border-top:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-1);min-width:0}",
			".pp-meta{color:var(--dsw-alias-label-secondary);font-size:11.5px;flex:0 1 auto;min-width:0;max-width:170px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
			".pp-vars{margin-top:8px;padding-top:8px;border-top:1px dashed var(--dsw-alias-border-l1)}",
			".pp-vlist{list-style:none;padding:0;margin:0 0 8px;display:flex;flex-direction:column;gap:4px}",
			".pp-vlist li{font-size:12px;line-height:1.5;color:var(--dsw-alias-label-primary)}",
			".pp-vlist code{padding:1px 5px;border-radius:5px;background:var(--dsw-alias-bg-layer-2);font-size:11.5px}",
			".pp-vwhy{color:var(--dsw-alias-label-secondary)}",
			".pp-btn{height:28px;padding:0 12px;border:1px solid var(--dsw-alias-border-l1);border-radius:8px;background:linear-gradient(180deg,color-mix(in srgb,var(--dsw-alias-label-primary) 8%,var(--dsw-alias-bg-base)),var(--dsw-alias-bg-base));box-shadow:inset 0 1px 0 color-mix(in srgb,var(--dsw-alias-label-primary) 14%,transparent),0 1px 4px rgba(0,0,0,.22);color:var(--dsw-alias-label-primary);font-size:12px;line-height:26px;cursor:pointer;font-family:inherit;white-space:nowrap;flex:0 0 auto;transition:background .12s ease,border-color .12s ease,color .12s ease,filter .12s ease,box-shadow .18s ease}",
			".pp-btn:hover:not(:disabled){background:linear-gradient(180deg,color-mix(in srgb,var(--dsw-alias-label-primary) 14%,var(--dsw-alias-bg-layer-2)),var(--dsw-alias-bg-layer-2));border-color:var(--dsw-alias-border-l2);box-shadow:inset 0 1px 0 color-mix(in srgb,var(--dsw-alias-label-primary) 20%,transparent),0 2px 8px rgba(0,0,0,.26)}",
			".pp-btn:active:not(:disabled){background:var(--dsw-alias-border-l1)}",
			".pp-btn:disabled{opacity:.45;cursor:not-allowed}",
			".pp-btn:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:1px}",
			".pp-btn[data-primary=\"1\"]{background:linear-gradient(180deg,color-mix(in srgb,var(--dsw-alias-label-primary) 16%,var(--dsw-alias-brand-primary)),var(--dsw-alias-brand-primary));border-color:var(--dsw-alias-brand-primary);color:#fff;font-weight:600;box-shadow:inset 0 1px 0 color-mix(in srgb,#fff 22%,transparent),0 0 12px color-mix(in srgb,var(--dsw-alias-brand-primary) 45%,transparent)}",
			".pp-btn[data-primary=\"1\"]:hover:not(:disabled){background:linear-gradient(180deg,color-mix(in srgb,var(--dsw-alias-label-primary) 16%,var(--dsw-alias-brand-primary)),var(--dsw-alias-brand-primary));filter:brightness(1.14);box-shadow:inset 0 1px 0 color-mix(in srgb,#fff 30%,transparent),0 0 16px color-mix(in srgb,var(--dsw-alias-brand-primary) 60%,transparent)}",
			".pp-btn[data-primary=\"1\"]:active:not(:disabled){background:var(--dsw-alias-brand-primary);filter:brightness(.88)}",
			".pp-mini{height:24px;padding:0 8px;font-size:11.5px;line-height:22px}",
			".pp-sel{height:28px;flex:0 1 auto;min-width:72px;max-width:190px;padding:0 6px;border:1px solid var(--dsw-alias-border-l1);border-radius:8px;background:linear-gradient(180deg,color-mix(in srgb,var(--dsw-alias-label-primary) 6%,var(--dsw-alias-bg-base)),var(--dsw-alias-bg-base));box-shadow:inset 0 1px 0 color-mix(in srgb,var(--dsw-alias-label-primary) 10%,transparent);color:var(--dsw-alias-label-secondary);font-size:11.5px;font-family:inherit;cursor:pointer;outline:none;transition:background .12s ease,color .12s ease,border-color .12s ease}",
			".pp-sel:hover:not(:disabled){color:var(--dsw-alias-label-primary);background:var(--dsw-alias-bg-layer-2)}",
			".pp-sel:disabled{opacity:.45;cursor:not-allowed}",
			".pp-sel:focus{border-color:var(--dsw-alias-brand-primary)}",
			".pp-sel:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:1px}",
		].join("\n");
		function ensureStyle() {
			if (typeof document === "undefined") return;
			/**
			 * A hot-reloaded bundle finds the previous bundle's tag still mounted;
			 * keeping it would leave every newly added class unstyled.
			 */
			var tag = document.getElementById(STYLE_ID);
			if (tag !== null) {
				if (tag.textContent !== CSS) tag.textContent = CSS;
				return;
			}
			tag = document.createElement("style");
			tag.id = STYLE_ID;
			tag.textContent = CSS;
			document.head.appendChild(tag);
		}
		//#endregion
		//#region api.js
		var OPTIMIZE_ROUTE = "/prompt-polish/optimize";
		var MODELS_ROUTE = "/prompt-polish/models";
		var EXTRACT_ROUTE = "/prompt-polish/extract-variables";
		/**
		 * Where the pinned polish model lives. The composer's own model can be an
		 * image model, which cannot answer a text rewrite, so the panel keeps a
		 * choice of its own and empty means "follow the composer".
		 */
		var PIN_KEY = "dsh.prompt-polish/model";
		function readPin() {
			try {
				var raw = localStorage.getItem(PIN_KEY);
				return typeof raw === "string" ? raw : "";
			} catch {
				return "";
			}
		}
		function writePin(value) {
			try {
				if (value === "") localStorage.removeItem(PIN_KEY);
				else localStorage.setItem(PIN_KEY, value);
			} catch {}
		}
		/** Reasoning-effort choice made at the composer, remembered like the model. */
		var EFFORT_KEY = "dsh.prompt-polish/effort";
		function readEffort() {
			try {
				var raw = localStorage.getItem(EFFORT_KEY);
				return typeof raw === "string" ? raw : "";
			} catch {
				return "";
			}
		}
		function writeEffort(value) {
			try {
				if (value === "") localStorage.removeItem(EFFORT_KEY);
				else localStorage.setItem(EFFORT_KEY, value);
			} catch {}
		}
		/** Effort ids the host's own models use when a model advertises no ladder. */
		var EFFORT_FALLBACK = [
			{ id: "low", name: "低" },
			{ id: "medium", name: "中" },
			{ id: "high", name: "高" }
		];
		/**
		 * The effort ladder that belongs to the selected model.
		 * @param catalog - the host catalog, or null while loading.
		 * @param pin - "provider/model", or "" for "follow the composer".
		 * @returns the choices to render; a shared ladder when the model has none.
		 */
		/** Human name of the picked model, or the id when the catalog has no label. */
		function modelLabelOf(catalog, pin) {
			var at = pin.indexOf("/");
			if (at <= 0) return "";
			var providerId = pin.slice(0, at);
			var modelId = pin.slice(at + 1);
			var groups = catalog === null || !Array.isArray(catalog.groups) ? [] : catalog.groups;
			for (var g = 0; g < groups.length; g += 1) {
				if (groups[g].provider !== providerId) continue;
				var models = Array.isArray(groups[g].models) ? groups[g].models : [];
				for (var m = 0; m < models.length; m += 1) if (models[m].id === modelId) return models[m].name ?? modelId;
			}
			return modelId;
		}
		/** Human name of the picked effort id. */
		function effortLabelOf(catalog, pin, effort) {
			var choices = effortChoices(catalog, pin);
			for (var i = 0; i < choices.length; i += 1) if (choices[i].id === effort) return choices[i].name;
			return effort;
		}
		function effortChoices(catalog, pin) {
			var at = pin.indexOf("/");
			if (catalog === null || at <= 0) return EFFORT_FALLBACK;
			var providerId = pin.slice(0, at);
			var modelId = pin.slice(at + 1);
			var groups = Array.isArray(catalog.groups) ? catalog.groups : [];
			for (var g = 0; g < groups.length; g += 1) {
				if (groups[g].provider !== providerId) continue;
				var models = Array.isArray(groups[g].models) ? groups[g].models : [];
				for (var m = 0; m < models.length; m += 1) {
					if (models[m].id === modelId && Array.isArray(models[m].efforts) && models[m].efforts.length > 0) return models[m].efforts;
				}
			}
			return EFFORT_FALLBACK;
		}
		/**
		 * Polish history, v2: a consent-gated, version-chained local record.
		 *
		 * The envelope is `{ schemaVersion, consent, entries }`. consent gates
		 * persistence: "unknown" saves nothing and raises the consent card after
		 * the first successful run; "granted" persists; "declined" persists
		 * nothing and wipes what was there. Entries form chains — an iterate run
		 * points at the version it revised via parentId/rootId — so 对比 and
		 * 删除整条链 operate on something honest. A legacy bare-array store (the
		 * first shipped format) migrates to consent:"granted" with normalized
		 * entries, preserving what the user already had. Any storage failure
		 * degrades to no-persistence rather than breaking a run.
		 */
		var HISTORY_KEY = "dsh.prompt-polish/history";
		var HISTORY_SCHEMA = 2;
		var HISTORY_MAX = 50;
		var HISTORY_CLIP = 4000;
		function clip(text) {
			if (typeof text !== "string") return "";
			return text.length > HISTORY_CLIP ? text.slice(0, HISTORY_CLIP) + "…" : text;
		}
		function emptyHistoryStore() {
			return { schemaVersion: HISTORY_SCHEMA, consent: "unknown", entries: [] };
		}
		/** Timestamps collide; the random tail keeps entry ids unique. */
		function newEntryId() {
			return Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8);
		}
		/** Fill in fields older formats lack, so views never branch on shape. */
		function normalizeEntry(entry) {
			var e = entry && typeof entry === "object" ? entry : {};
			var id = typeof e.id === "string" && e.id !== "" ? e.id : String(e.id === void 0 || e.id === null ? newEntryId() : e.id);
			return {
				id: id,
				rootId: typeof e.rootId === "string" && e.rootId !== "" ? e.rootId : id,
				parentId: typeof e.parentId === "string" ? e.parentId : null,
				at: typeof e.at === "number" ? e.at : typeof e.id === "number" ? e.id : Date.now(),
				mode: typeof e.mode === "string" ? e.mode : "",
				template: typeof e.template === "string" ? e.template : "",
				templateId: typeof e.templateId === "string" ? e.templateId : "",
				model: typeof e.model === "string" ? e.model : "",
				input: typeof e.input === "string" ? e.input : "",
				output: typeof e.output === "string" ? e.output : "",
				usage: e.usage && typeof e.usage === "object" ? e.usage : void 0,
				elapsedMs: typeof e.elapsedMs === "number" ? e.elapsedMs : 0,
				source: typeof e.source === "string" ? e.source : "run"
			};
		}
		function readHistoryStore() {
			try {
				var raw = localStorage.getItem(HISTORY_KEY);
				if (typeof raw !== "string" || raw === "") return emptyHistoryStore();
				var parsed = JSON.parse(raw);
				if (Array.isArray(parsed)) {
					return { schemaVersion: HISTORY_SCHEMA, consent: "granted", entries: parsed.map(normalizeEntry) };
				}
				if (parsed === null || typeof parsed !== "object") return emptyHistoryStore();
				return {
					schemaVersion: HISTORY_SCHEMA,
					consent: parsed.consent === "granted" || parsed.consent === "declined" ? parsed.consent : "unknown",
					entries: Array.isArray(parsed.entries) ? parsed.entries.map(normalizeEntry) : []
				};
			} catch {
				return emptyHistoryStore();
			}
		}
		function writeHistoryStore(store) {
			try {
				localStorage.setItem(HISTORY_KEY, JSON.stringify(store));
			} catch {}
		}
		/**
		 * Over-capacity prune: drop whole oldest chains first (the newest chain is
		 * never dropped wholesale), then trim tail entries one by one, re-parenting
		 * their children so every surviving chain stays walkable.
		 */
		function pruneEntries(entries) {
			if (entries.length <= HISTORY_MAX) return entries;
			var roots = [];
			var seen = {};
			for (var i = 0; i < entries.length; i++) {
				var r = entries[i].rootId || entries[i].id;
				if (!seen[r]) {
					seen[r] = true;
					roots.push(r);
				}
			}
			var dropped = {};
			var remaining = entries.length;
			for (var k = roots.length - 1; k >= 1 && remaining > HISTORY_MAX; k--) {
				var size = 0;
				for (var i2 = 0; i2 < entries.length; i2++) if ((entries[i2].rootId || entries[i2].id) === roots[k]) size++;
				remaining -= size;
				dropped[roots[k]] = true;
			}
			var result = [];
			for (var i3 = 0; i3 < entries.length; i3++) {
				if (!dropped[entries[i3].rootId || entries[i3].id]) result.push(entries[i3]);
			}
			while (result.length > HISTORY_MAX) {
				var oldest = result.pop();
				for (var j = 0; j < result.length; j++) {
					if (result[j].parentId === oldest.id) {
						result[j].parentId = oldest.parentId || null;
						if (result[j].parentId === null) result[j].rootId = result[j].id;
					}
				}
			}
			return result;
		}
		function appendEntry(store, entry) {
			return {
				schemaVersion: HISTORY_SCHEMA,
				consent: store.consent,
				entries: pruneEntries([entry].concat(store.entries))
			};
		}
		/** Remove one version; its children splice up to the removed node's parent. */
		function dropEntry(entries, id) {
			var removed = null;
			var next = [];
			for (var i = 0; i < entries.length; i++) {
				if (entries[i].id === id) removed = entries[i];
				else next.push(entries[i]);
			}
			if (removed === null) return entries;
			for (var j = 0; j < next.length; j++) {
				if (next[j].parentId === id) {
					next[j].parentId = removed.parentId;
					if (next[j].parentId === null) next[j].rootId = next[j].id;
				}
			}
			return next;
		}
		function dropChain(entries, rootId) {
			return entries.filter(function(entry) {
				return entry.rootId !== rootId;
			});
		}
		/** One chain, oldest first: 原稿 → 每一次润色. */
		function chainOf(entries, rootId) {
			var chain = [];
			for (var i = 0; i < entries.length; i++) {
				if (entries[i].rootId === rootId) chain.push(entries[i]);
			}
			return chain.reverse();
		}
		/** Token sentence used by the result area, history cards and 对比. */
		/**
		 * One line that always answers "did the fork carry anything?" — including
		 * the failure reason, so a silent zero cannot be mistaken for success.
		 * @param info - the host's `context` field, or null.
		 * @returns the sentence rendered under the result.
		 */
		function contextNote(info) {
			if (info === null || info === void 0) return "上下文：宿主未返回（客户端或宿主版本较旧）";
			var attached = typeof info.attached === "number" ? info.attached : 0;
			if (attached > 0) return "上下文 " + attached + " 条（只读快照）";
			return "上下文 0 条" + (typeof info.reason === "string" ? " · " + info.reason : "");
		}
		function usageText(usage) {
			if (usage && typeof usage.inputTokens === "number" && typeof usage.outputTokens === "number") {
				return "本次 " + usage.inputTokens + " 输入 + " + usage.outputTokens + " 输出 = " + (typeof usage.totalTokens === "number" ? usage.totalTokens : usage.inputTokens + usage.outputTokens) + " tokens";
			}
			return "本次用量未提供";
		}
		/** Local "Sep 28 14:03" stamp without leaning on locale surprises. */
		function formatWhen(ms) {
			var d = new Date(ms);
			var months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
			var pad = function(n) {
				return (n < 10 ? "0" : "") + n;
			};
			return months[d.getMonth()] + " " + d.getDate() + " " + pad(d.getHours()) + ":" + pad(d.getMinutes());
		}
		/**
		 * 智能火苗的判分：纯本地、纯字符串，绝不调用模型。
		 * 分数越高代表草稿越可能“没说清”，达到阈值火才烧起来：
		 *   burn ≥ 4：短、缺动作/背景/输出形式或用词模糊，最值得润色；
		 *   ember 2-3：介于两者之间，火调暗；
		 *   quiet：空草稿、长而完整的草稿，或者刚润色过的同一份文本。
		 */
		var HINT_INTENT = /帮我|请|给我|写一|写个|做个|来一|生成|翻译|总结|分析|优化|起草|列出|设计|实现|检查|改写|润色|回答|解释|评估|编写|拟/;
		var HINT_OUTPUT = /格式|表格|列表|要点|步骤|json|JSON|Markdown|markdown|字数|字以内|字左右|正式|口语|风格|结构|分点|大纲|一段|一篇|条理/;
		var HINT_CONTEXT = /背景|目标|因为|由于|需要|用途|场景|对象|受众|上周|本周|今天|明天|昨天|项目|公司|客户|领导|老师|数据|主题|题目|时间/;
		var HINT_VAGUE = /随便|简单写|大概|看看|试试|优化一下|来一个|帮我写个|写个.{0,6}就行/;
		function scoreDraft(text) {
			var raw = typeof text === "string" ? text : "";
			if (raw.trim() === "") return { level: "quiet", score: 0, reasons: [] };
			var compact = raw.replace(/\s+/g, "");
			var score = 0;
			var reasons = [];
			if (compact.length < 80) {
				score += 2;
				reasons.push("内容较短");
			}
			if (!HINT_INTENT.test(raw)) {
				score += 1;
				reasons.push("没有明确的动作要求");
			}
			if (!HINT_OUTPUT.test(raw)) {
				score += 1;
				reasons.push("没有说清输出形式");
			}
			if (!HINT_CONTEXT.test(raw)) {
				score += 1;
				reasons.push("缺少背景或对象");
			}
			if (HINT_VAGUE.test(raw)) {
				score += 2;
				reasons.push("要求比较模糊");
			}
			if (compact.length > 600) {
				score -= 3;
				reasons.push("内容已经比较完整");
			}
			var level = score >= 4 ? "burn" : score >= 2 ? "ember" : "quiet";
			return { level: level, score: score, reasons: reasons };
		}
		/**
		 * 结构变化：确定性的前后对照，行级 LCS 加上“目标/背景/约束/输出格式”
		 * 四个角色标记的有无——全部本地计算，展示为“本机分析”，绝不冒充模型判断。
		 */
		var DIFF_LINE_CAP = 400;
		function splitLines(text) {
			var t = String(text === void 0 || text === null ? "" : text).replace(/\r\n?/g, "\n").replace(/\s+$/, "");
			return t === "" ? [] : t.split("\n");
		}
		function lineDiffCounts(a, b) {
			if (a.length > DIFF_LINE_CAP || b.length > DIFF_LINE_CAP) {
				return { added: Math.max(0, b.length - a.length), removed: Math.max(0, a.length - b.length), approximate: true };
			}
			var n = a.length;
			var m = b.length;
			var width = m + 1;
			var table = new Int32Array((n + 1) * width);
			for (var i = n - 1; i >= 0; i--) {
				var row = i * width;
				var below = row + width;
				for (var j = m - 1; j >= 0; j--) {
					table[row + j] = a[i] === b[j] ? table[below + j + 1] + 1 : Math.max(table[below + j], table[row + j + 1]);
				}
			}
			var common = 0;
			var x = 0;
			var y = 0;
			while (x < n && y < m) {
				if (a[x] === b[y]) {
					common++;
					x++;
					y++;
				} else if (table[(x + 1) * width + y] >= table[x * width + y + 1]) {
					x++;
				} else {
					y++;
				}
			}
			return { added: m - common, removed: n - common, approximate: false };
		}
		var STRUCT_ROLES = [
			["goal", "目标/动作", /帮我|请|给我|目标是|需要你|你要|任务|帮我做/],
			["context", "背景", /背景|上下文|因为|由于|对象|受众|场景|用途|上周|本周|今天|数据|项目/],
			["constraints", "约束", /不要|不能|必须|限制|不超过|至少|避免|禁止|只能|仅限/],
			["format", "输出格式", /格式|表格|列表|要点|步骤|json|JSON|Markdown|markdown|字数|分点|大纲|一段|正式|口语/]
		];
		function analyzeChange(before, after) {
			var a = splitLines(before);
			var b = splitLines(after);
			var counts = lineDiffCounts(a, b);
			var beforeText = typeof before === "string" ? before : "";
			var afterText = typeof after === "string" ? after : "";
			var gained = [];
			var lost = [];
			for (var i = 0; i < STRUCT_ROLES.length; i++) {
				var role = STRUCT_ROLES[i];
				var had = role[2].test(beforeText);
				var has = role[2].test(afterText);
				if (!had && has) gained.push(role[1]);
				else if (had && !has) lost.push(role[1]);
			}
			return {
				beforeChars: beforeText.replace(/\s+/g, "").length,
				afterChars: afterText.replace(/\s+/g, "").length,
				addedLines: counts.added,
				removedLines: counts.removed,
				approximate: counts.approximate,
				gained: gained,
				lost: lost
			};
		}
		function formatWhen(ms) {
			var d = new Date(ms);
			var months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
			var pad = function(n) {
				return (n < 10 ? "0" : "") + n;
			};
			return months[d.getMonth()] + " " + d.getDate() + " " + pad(d.getHours()) + ":" + pad(d.getMinutes());
		}
		/**
		 * Ask the host half which models the panel may pin.
		 * @returns the current selection plus provider-grouped models.
		 */
		async function fetchModels() {
			var response = await fetch(MODELS_ROUTE, {
				method: "GET",
				credentials: "same-origin"
			});
			if (!response.ok) throw new Error("HTTP " + response.status);
			return await response.json();
		}
		/**
		 * Module-level catalog cache with a short TTL + in-flight dedup.
		 *
		 * Every composer mount used to re-fetch `/models`, so switching sessions
		 * re-paid the round trip even though the template half of the answer never
		 * changes within a run. 30s keeps the model half fresh enough for a
		 * mid-session provider addition while making re-mounts instant, and the
		 * shared promise stops two composers mounting at once from firing twice.
		 * Failures are NOT cached: the next mount retries.
		 */
		var CATALOG_TTL_MS = 30000;
		var catalogCache = null;
		var catalogInflight = null;
		function loadCatalog() {
			if (catalogCache !== null && Date.now() - catalogCache.at < CATALOG_TTL_MS) return Promise.resolve(catalogCache.data);
			if (catalogInflight === null) {
				catalogInflight = fetchModels().then(function(data) {
					catalogCache = {
						at: Date.now(),
						data
					};
					catalogInflight = null;
					return data;
				}, function(cause) {
					catalogInflight = null;
					throw cause;
				});
			}
			return catalogInflight;
		}
		/**
		 * The tab row and the template picker are NOT hardcoded here. They come from
		 * `GET ${MODELS_ROUTE}`, which mirrors the host's own template library, so a
		 * new template or a new `optimizationMode` cannot drift out of sync with the
		 * ids the optimize route will accept.
		 */
		/**
		 * Stream one optimization from the host half.
		 * @param body - the request payload.
		 * @param onDelta - called per received text delta.
		 * @param signal - aborts the run.
		 * @returns the final text and the model that produced it.
		 */
		async function stream(body, onDelta, signal) {
			var response = await fetch(OPTIMIZE_ROUTE, {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify(body),
				credentials: "same-origin",
				signal
			});
			if (!response.ok) {
				var detail = "";
				try {
					var failure = await response.json();
					detail = typeof failure.message === "string" ? failure.message : "";
				} catch {}
				throw new Error(detail !== "" ? detail : "请求失败（HTTP " + response.status + "）");
			}
			var reader = response.body.getReader();
			var decoder = new TextDecoder();
			var buffer = "";
			var finalText = "";
			var model = "";
			var usage = null;
			while (true) {
				var _ref = await reader.read(), done = _ref.done, value = _ref.value;
				if (done) break;
				buffer += decoder.decode(value, { stream: true });
				var lines = buffer.split("\n");
				buffer = lines.pop() ?? "";
				for (var _i = 0, _lines = lines; _i < _lines.length; _i++) {
					var line = _lines[_i];
					if (line.trim() === "") continue;
					var event = void 0;
					try {
						event = JSON.parse(line);
					} catch {
						continue;
					}
					if (event.type === "delta") {
						finalText += event.text;
						onDelta(event.text);
					} else if (event.type === "error") {
						throw new Error(event.message || "优化失败");
					} else if (event.type === "done") {
						finalText = event.text;
						model = event.model || "";
						usage = event.usage && typeof event.usage === "object" ? event.usage : null;
					}
				}
			}
			if (finalText.trim() === "") throw new Error("模型没有返回可用内容。");
			return {
				text: finalText,
				model,
				usage
			};
		}
		/**
		 * One non-streaming call: ask the host to find the parameterisable spans in a
		 * finished prompt. The host answers with the parsed list AND the templated
		 * text, because substituting the spans needs the occurrence arithmetic that
		 * lives server-side; a wrong offset there would silently rewrite the prompt.
		 * @param promptContent - the text to analyse.
		 * @param pin - optional `{ provider, model }` override.
		 * @param signal - aborts the request.
		 * @returns `{ variables, summary, templated, model }`.
		 */
		async function extractVariables(promptContent, pin, signal) {
			var body = { promptContent };
			if (pin !== null) {
				body.provider = pin.provider;
				body.model = pin.model;
			}
			var response = await fetch(EXTRACT_ROUTE, {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify(body),
				credentials: "same-origin",
				signal
			});
			var payload = void 0;
			try {
				payload = await response.json();
			} catch {}
			if (!response.ok) {
				var detail = payload && typeof payload.message === "string" ? payload.message : "";
				throw new Error(detail !== "" ? detail : "提取失败（HTTP " + response.status + "）");
			}
			return payload;
		}
		//#endregion
		//#region view.js
		/**
		 * The composer seat beside the model selector, and the panel it opens.
		 *
		 * Reads and writes the draft through the slot's own session props, so the
		 * button always acts on the composer it is rendered in — including a
		 * subagent composer — without holding a session id of its own.
		 * @param props - the session slot props (`useInput`, `inputActions`).
		 */
		/**
		 * The composer slot is session-scoped, so a session id may ride along on
		 * the props. Read it defensively: an older shell that passes none simply
		 * polishes without the context fork.
		 * @param props - slot props.
		 * @returns the id, or null.
		 */
		function sessionIdOf(props) {
			var candidates = [props.sessionId, props.session && props.session.id, props.session && props.session.sessionId];
			/**
			 * The conversation root publishes its session id as a DOM attribute; a
			 * composer slot that gets no session prop can still read it from there.
			 */
			if (typeof document !== "undefined") {
				var root = document.querySelector("[data-conversation-session]");
				candidates.push(root === null ? null : root.getAttribute("data-conversation-session"));
			}
			for (var index = 0; index < candidates.length; index += 1) {
				if (typeof candidates[index] === "string" && candidates[index] !== "") return candidates[index];
			}
			return null;
		}
		function PromptPolish(props) {
			ensureStyle();
			var useInput = props.useInput;
			var inputActions = props.inputActions;
			var draft = typeof useInput === "function" ? useInput(function(state) {
				return state.draft;
			}) : "";
			var draftRef = useRef(draft);
			draftRef.current = draft;
			var _s1 = useState(false), open = _s1[0], setOpen = _s1[1];
			/** Null means the user has not selected a tab in this component instance. */
			var _s2 = useState(null), selectedMode = _s2[0], setMode = _s2[1];
			var _s2b = useState(""), templateId = _s2b[0], setTemplateId = _s2b[1];
			var _s3 = useState(""), feedback = _s3[0], setFeedback = _s3[1];
			var _s4 = useState(""), result = _s4[0], setResult = _s4[1];
			var _s5 = useState("idle"), status = _s5[0], setStatus = _s5[1];
			var _s6 = useState(""), error = _s6[0], setError = _s6[1];
			var _s7 = useState(""), modelUsed = _s7[0], setModelUsed = _s7[1];
			var _s9 = useState(null), anchor = _s9[0], setAnchor = _s9[1];
			var _s10 = useState(readPin), pin = _s10[0], setPin = _s10[1];
			var _s10e = useState(readEffort), effort = _s10e[0], setEffort = _s10e[1];
			/** The compact composer entry's popover; collapsed on load and after a pick. */
			var _s10p = useState(false), picksOpen = _s10p[0], setPicksOpen = _s10p[1];
			/** Which page of the popover is showing: the two cells or one option list. */
			var _s10v = useState("root"), picksView = _s10v[0], setPicksView = _s10v[1];
			var _s11 = useState(null), catalog = _s11[0], setCatalog = _s11[1];
			/** The panel's own effort control mirrors the composer pick: one state. */
			var panelEffort = h("select", {
				key: "pp-effort",
				className: "pp-sel",
				value: effort,
				disabled: status === "running",
				title: "思考强度（与输入框工具栏的选择同步）",
				onChange: function(event) {
					setEffort(event.target.value);
					writeEffort(event.target.value);
				}
			}, h("option", { value: "" }, "思考强度：默认"), effortChoices(catalog, pin).map(function(entry) {
				return h("option", {
					key: entry.id,
					value: entry.id
				}, entry.name);
			}));
			/** The default follows the same ordered catalog rendered by the tab row. */
			var modes = catalog !== null && Array.isArray(catalog.modes) ? catalog.modes : [];
			var mode = modes.length > 0 ? modes[0].id : "";
			if (typeof selectedMode === "string" && modes.some(function(entry) { return entry.id === selectedMode; })) mode = selectedMode;
			/** Extraction result for the current output, or null when not extracted. */
			var _s12 = useState(null), vars = _s12[0], setVars = _s12[1];
			var _s13 = useState(false), extracting = _s13[0], setExtracting = _s13[1];
			/** Token usage reported by the stream's usage chunk; null when absent. */
			var _s14 = useState(null), usage = _s14[0], setUsage = _s14[1];
			/** What the forked context carried, straight from the host reply. */
			var _sctx = useState(null), contextInfo = _sctx[0], setContextInfo = _sctx[1];
			/** Wall-clock ms of the last finished run; 0 until one finishes. */
			var _s15 = useState(0), elapsedMs = _s15[0], setElapsedMs = _s15[1];
			/** Transient "已复制" feedback on the result-area copy button. */
			var _s16 = useState(""), copied = _s16[0], setCopied = _s16[1];
			/** Whether the panel body is showing history instead of the live run. */
			var _s17 = useState(false), historyOpen = _s17[0], setHistoryOpen = _s17[1];
			/** Retained slot: superseded by the v2 store state right below. */
			var _s18 = useState(null), historyLegacy = _s18[0], setHistory = _s18[1];
			/** Id of the one expanded record, or "" when collapsed. */
			var _s19 = useState(0), openId = _s19[0], setOpenId = _s19[1];
			/**
			 * The persisted history envelope (consent + entries), kept in state so
			 * consent changes and new runs re-render in the same tick they persist.
			 */
			var _s20 = useState(readHistoryStore), store = _s20[0], setStore = _s20[1];
			/** Consent card stays up until the user picks 开启/不保存. */
			var _s21 = useState(store.consent === "unknown"), consentOpen = _s21[0], setConsentOpen = _s21[1];
			/** Which chain the 对比 view walks, and whether it is open at all. */
			var _s22 = useState(""), chainView = _s22[0], setChainView = _s22[1];
			/** 对比's middle column: which version sits next to 原稿. */
			var _s23 = useState(""), cmpId = _s23[0], setCmpId = _s23[1];
			/**
			 * Draft-quality scoring stays available (exported as __scoreDraft and kept
			 * under test); the visual design settled on the always-lit flame, so the
			 * hint state is computed only for the tooltip experiment, not the render.
			 */
			var hintLevel = scoreDraft(draft).level;
			/** The version chain 对比 walks; "" until the user opens it. */
			var chain = useMemo(function() {
				if (chainView === "") return [];
				return chainOf(store.entries, chainView);
			}, [chainView, store.entries]);
			/** 对比's middle column falls back to the newest version of the chain. */
			var cmpEntry = useMemo(function() {
				if (chain.length === 0) return null;
				for (var i = 0; i < chain.length; i++) if (chain[i].id === cmpId) return chain[i];
				return chain[chain.length - 1];
			}, [chain, cmpId]);
			/** 原稿 = the chain's first entry's input; 对比 needs at least one version. */
			var cmpOriginal = chain.length > 0 ? chain[0].input : "";
			var cmpAnalysis = useMemo(function() {
				if (cmpEntry === null) return null;
				return analyzeChange(cmpOriginal, cmpEntry.output);
			}, [cmpOriginal, cmpEntry]);
			/** Chain-level token sentence; honest when some runs lack usage. */
			var cmpUsage = useMemo(function() {
				var input = 0;
				var output = 0;
				var total = 0;
				var missing = 0;
				for (var i = 0; i < chain.length; i++) {
					var u = chain[i].usage;
					if (u && typeof u.inputTokens === "number" && typeof u.outputTokens === "number") {
						input += u.inputTokens;
						output += u.outputTokens;
						total += typeof u.totalTokens === "number" ? u.totalTokens : u.inputTokens + u.outputTokens;
					} else {
						missing++;
					}
				}
				if (chain.length === 0) return "";
				if (missing > 0) return "整条链共 " + missing + " 次未提供用量（部分模型不上报），其余 " + (input + output) + " tokens";
				return "整条链共 " + input + " 输入 + " + output + " 输出 = " + total + " tokens";
			}, [chain]);
			var seatRef = useRef(null);
			var picksRef = useRef(null);
			var panelRef = useRef(null);
			var abortRef = useRef(null);
			var extractRef = useRef(null);
			var copyTimerRef = useRef(null);
			/** Split "provider/model" into the pair the host half expects. */
			var pinned = useMemo(function() {
				var at = pin.indexOf("/");
				if (pin === "" || at <= 0) return null;
				return {
					provider: pin.slice(0, at),
					model: pin.slice(at + 1)
				};
			}, [pin]);
			/** Load the picker once per session; a failure just leaves it empty. */
			/**
			 * Fetched on mount, not on first open: the seat's click also starts a run in
			 * the same tick, and that run needs a template. Waiting for the panel would
			 * make the very first click fail with "catalog not loaded" for no reason.
			 */
			useEffect(function() {
				if (catalog !== null) return;
				var cancelled = false;
				loadCatalog().then(function(data) {
					if (!cancelled) setCatalog(data);
				}, function() {
					if (!cancelled) setCatalog({
						current: null,
						groups: [],
						modes: [],
						templates: []
					});
				});
				return function() {
					cancelled = true;
				};
			}, [catalog]);
			/** Templates the server offers for the selected `optimizationMode`. */
			var family = useMemo(function() {
				var list = catalog === null || catalog.templates === void 0 ? [] : catalog.templates;
				return list.filter(function(entry) {
					return entry.optimizationMode === mode;
				});
			}, [catalog, mode]);
			/** Falls back to the family's first entry so a stale id never blocks a run. */
			var template = useMemo(function() {
				for (var i = 0; i < family.length; i++) {
					if (family[i].id === templateId) return family[i];
				}
				return family.length > 0 ? family[0] : null;
			}, [family, templateId]);
			/** The text a run should optimize: the draft, or the last result when iterating. */
			var sourceFor = useCallback(function(nextMode) {
				if (nextMode === "iterate" && result !== "") return result;
				return draftRef.current ?? "";
			}, [result]);
			var place = useCallback(function() {
				var seat = seatRef.current;
				if (seat === null) return;
				var box = seat.getBoundingClientRect();
				var width = Math.min(560, window.innerWidth - 24);
				var left = Math.max(12, Math.min(box.left - 8, window.innerWidth - width - 12));
				setAnchor({
					left,
					width,
					bottom: Math.max(12, window.innerHeight - box.top + 8)
				});
			}, []);
			useEffect(function() {
				if (!open) return;
				place();
				var onMove = function() {
					place();
				};
				var onKey = function(event) {
					if (event.key === "Escape") close();
				};
				var onDown = function(event) {
					var target = event.target;
					if (panelRef.current !== null && panelRef.current.contains(target)) return;
					if (seatRef.current !== null && seatRef.current.contains(target)) return;
					close();
				};
				function close() {
					setOpen(false);
				}
				window.addEventListener("resize", onMove);
				window.addEventListener("keydown", onKey);
				window.addEventListener("mousedown", onDown, true);
				return function() {
					window.removeEventListener("resize", onMove);
					window.removeEventListener("keydown", onKey);
					window.removeEventListener("mousedown", onDown, true);
				};
			}, [open, place]);
			/** Measured placement: the popover escapes any composer overflow clipping. */
			var _popPos = useState(null), popPos = _popPos[0], setPopPos = _popPos[1];
			useEffect(function() {
				if (!picksOpen) {
					setPopPos(null);
					return;
				}
				var place = function() {
					var node = picksRef.current;
					if (node === null) return;
					var box = node.getBoundingClientRect();
					setPopPos({ left: Math.max(8, box.left), bottom: Math.max(8, window.innerHeight - box.top + 8) });
				};
				place();
				window.addEventListener("resize", place);
				return function() {
					window.removeEventListener("resize", place);
				};
			}, [picksOpen]);
			/** The composer picker popover closes on outside clicks and Escape. */
			useEffect(function() {
				if (!picksOpen) return;
				var onDown = function(event) {
					if (picksRef.current !== null && picksRef.current.contains(event.target)) return;
					setPicksView("root");
					setPicksOpen(false);
				};
				var onKey = function(event) {
					if (event.key === "Escape") {
						setPicksView("root");
						setPicksOpen(false);
					}
				};
				window.addEventListener("mousedown", onDown, true);
				window.addEventListener("keydown", onKey);
				return function() {
					window.removeEventListener("mousedown", onDown, true);
					window.removeEventListener("keydown", onKey);
				};
			}, [picksOpen]);
			var stop = useCallback(function() {
				if (abortRef.current !== null) abortRef.current.abort();
			}, []);
			useEffect(function() {
				return stop;
			}, [stop]);
			var run = useCallback(function(nextMode, nextTemplate) {
				/** One generation at a time: a second click while running is a no-op. */
				if (abortRef.current !== null) return;
				if (nextTemplate === null) {
					setError("模板目录还没载入，请稍后重试。");
					return;
				}
				var source = sourceFor(nextMode);
				if (typeof source !== "string" || source.trim() === "") {
					setError("输入框里还没有内容可润色。");
					setResult("");
					return;
				}
				if (nextMode === "iterate" && feedback.trim() === "") {
					setError("迭代优化要先填改进意见。");
					setResult("");
					return;
				}
				setError("");
				setResult("");
				setModelUsed("");
				setVars(null);
				setUsage(null);
				setElapsedMs(0);
				setHistoryOpen(false);
				setStatus("running");
				setOpen(true);
				var startedAt = Date.now();
				var controller = new AbortController();
				abortRef.current = controller;
				var carried = "";
				/**
				 * Delta batching. One `setResult` per token re-rendered the whole panel
				 * per token (bench: 300 deltas → 310 renders); a reasoning model at
				 * 50-100 tok/s turns that into visible stutter. Flush at most every
				 * 60ms instead — still far faster than the eye reads — and let the
				 * terminal handlers write the exact final text unconditionally, so
				 * throttling can never cost accuracy or strand the tail on abort.
				 */
				var flushTimer = null;
				var dropFlush = function() {
					if (flushTimer !== null) {
						clearTimeout(flushTimer);
						flushTimer = null;
					}
				};
				/**
				 * The wire is upstream's `OptimizationRequest`, not a bag of template
				 * variables: `targetPrompt` is always the text being optimized, and the
				 * iterate family names its two extra inputs explicitly. Which slot each
				 * template reads is the server's business — it renders the template.
				 */
				var body = {
					optimizationMode: nextMode,
					targetPrompt: source,
					templateId: nextTemplate.id
				};
				if (nextMode === "iterate") {
					body.lastOptimizedPrompt = result !== "" ? result : source;
					body.iterateInput = feedback;
				}
				if (pinned !== null) {
					body.provider = pinned.provider;
					body.model = pinned.model;
				}
				if (effort !== "") body.reasoningEffort = effort;
				/**
				 * 用户提示词模式先 fork 当前会话上下文：宿主只读快照，写回永远
				 * 只落在输入框，会话本身不变。
				 */
				if (nextMode === "user") {
					body.forkContext = true;
					var sessionId = sessionIdOf(props);
					if (sessionId !== null) body.sessionId = sessionId;
				}
				stream(body, function(text) {
					carried += text;
					if (flushTimer === null) {
						flushTimer = setTimeout(function() {
							flushTimer = null;
							setResult(carried);
						}, 60);
					}
				}, controller.signal).then(function(out) {
					dropFlush();
					setResult(out.text);
					setModelUsed(out.model);
					setUsage(out.usage);
					setContextInfo(out.context !== void 0 && out.context !== null ? out.context : null);
					setElapsedMs(Date.now() - startedAt);
					setStatus("done");
					/**
					 * A finished run becomes a version: granted persists it, unknown
					 * raises the consent card and keeps the run in memory only, declined
					 * keeps nothing. Iterating a previous version links parent/root so
					 * 对比 and 删除整条链 operate on the real chain.
					 */
					var entry = {
						id: newEntryId(),
						at: Date.now(),
						mode: nextMode,
						template: nextTemplate.label || nextTemplate.id,
						templateId: nextTemplate.id,
						model: out.model,
						input: clip(source),
						output: clip(out.text),
						usage: out.usage !== null && out.usage !== void 0 ? { inputTokens: out.usage.inputTokens, outputTokens: out.usage.outputTokens, totalTokens: out.usage.totalTokens } : void 0,
						elapsedMs: Date.now() - startedAt,
						source: "run"
					};
					if (baseEntry !== null && nextMode === "iterate") {
						entry.parentId = baseEntry.id;
						entry.rootId = baseEntry.rootId;
					} else {
						entry.parentId = null;
						entry.rootId = entry.id;
						lastRunIdRef.current = entry.id;
					}
					if (store.consent === "granted") {
						var nextStore = appendEntry(store, entry);
						writeHistoryStore(nextStore);
						setStore(nextStore);
					} else if (store.consent === "unknown") {
						/** Hold the pending entry aside; it lands on disk only if granted. */
						pendingEntryRef.current = entry;
						setConsentOpen(true);
					}
				}, function(cause) {
					dropFlush();
					if (controller.signal.aborted) {
						/** A stopped run keeps whatever already arrived, tail included. */
						if (carried !== "") {
							setResult(carried);
							setElapsedMs(Date.now() - startedAt);
						}
						setStatus(carried !== "" ? "done" : "idle");
						return;
					}
					if (carried !== "") setResult(carried);
					setElapsedMs(Date.now() - startedAt);
					setError(cause instanceof Error ? cause.message : String(cause));
					setStatus("error");
				}).finally(function() {
					if (abortRef.current === controller) abortRef.current = null;
				});
			}, [effort, feedback, result, sourceFor, pinned, store, baseEntry]);
			var choose = useCallback(function(nextMode) {
				setMode(nextMode);
				setError("");
				var list = catalog === null || catalog.templates === void 0 ? [] : catalog.templates.filter(function(entry) {
					return entry.optimizationMode === nextMode;
				});
				/**
				 * First pick is the server's documented default for the family
				 * (`catalog.defaults`, e.g. 专业优化 for user prompts per the upstream
				 * quick-start), falling back to list order — never a client-side
				 * hardcoded id, so the server stays the single source of truth.
				 */
				var preferred = catalog !== null && catalog.defaults !== void 0 ? catalog.defaults[nextMode] : void 0;
				var next = null;
				if (typeof preferred === "string") {
					for (var i = 0; i < list.length; i++) {
						if (list[i].id === preferred) {
							next = list[i];
							break;
						}
					}
				}
				if (next === null && list.length > 0) next = list[0];
				setTemplateId(next === null ? "" : next.id);
				// Iterate needs the revision note first, so it waits for the run button.
				if (nextMode !== "iterate" && next !== null) run(nextMode, next);
			}, [run, catalog]);
			/** Picking another template in the same family re-runs, like the tabs do. */
			var pickTemplate = useCallback(function(entry) {
				setTemplateId(entry.id);
				setError("");
				if (mode !== "iterate") run(mode, entry);
			}, [mode, run]);
			var accept = useCallback(function() {
				if (result === "" || inputActions === void 0) return;
				inputActions.setDraft(result);
				setOpen(false);
				setResult("");
				setVars(null);
				setStatus("idle");
			}, [inputActions, result]);
			/**
			 * Write the result back and submit it in one go.
			 *
			 * Calling `submit()` immediately after `setDraft()` is safe: the draft write
			 * is a discrete Lexical update, which flushes its update listener — and with
			 * it `projection.clipboardText`, the field `submit()` reads — before returning.
			 * `submit()` takes the composer's normal Enter path, so while a turn is
			 * running the message queues instead of interrupting it.
			 */
			var send = useCallback(function() {
				if (result === "" || inputActions === void 0) return;
				inputActions.setDraft(result);
				inputActions.submit();
				setOpen(false);
				setResult("");
				setVars(null);
				setStatus("idle");
			}, [inputActions, result]);
			/**
			 * Ask the host which spans of the current output are parameterisable. Its
			 * own call with its own template — not a mode of the optimizer, matching
			 * upstream's separate `VariableExtractionService`.
			 */
			var extract = useCallback(function() {
				if (result === "" || extracting) return;
				setError("");
				setVars(null);
				setExtracting(true);
				var controller = new AbortController();
				extractRef.current = controller;
				extractVariables(result, pinned, controller.signal).then(function(out) {
					setVars(out);
				}, function(cause) {
					if (controller.signal.aborted) return;
					setError(cause instanceof Error ? cause.message : String(cause));
				}).finally(function() {
					setExtracting(false);
					if (extractRef.current === controller) extractRef.current = null;
				});
			}, [result, pinned, extracting]);
			/**
			 * Write the slot-substituted text back. Deliberately does not send: a
			 * templated prompt is a draft with holes, and the point of extracting
			 * variables is to keep editing it.
			 */
			var applyTemplate = useCallback(function() {
				if (vars === null || typeof vars.templated !== "string" || inputActions === void 0) return;
				inputActions.setDraft(vars.templated);
				setOpen(false);
				setResult("");
				setVars(null);
			}, [inputActions, vars]);
			/**
			 * Copy the finished result to the clipboard — the doc-level 「优化并复制
			 * 结果」 action: upstream's result workspace carries its own copy button,
			 * and this one touches neither the draft nor the send queue. Purely
			 * additive; falls back to the legacy execCommand path for renderers
			 * without the async Clipboard API.
			 */
			/**
			 * Copy any text to the clipboard; `flash` names which button should
			 * briefly show 已复制 ✓. Falls back to the legacy execCommand path for
			 * renderers without the async Clipboard API.
			 */
			var copyText = useCallback(function(text, flash) {
				if (typeof text !== "string" || text === "") return;
				var mark = function() {
					setCopied(flash);
					if (copyTimerRef.current !== null) clearTimeout(copyTimerRef.current);
					copyTimerRef.current = setTimeout(function() {
						copyTimerRef.current = null;
						setCopied("");
					}, 1500);
				};
				var fail = function() {
					setError("复制到剪贴板失败，请手动选中结果文本复制。");
				};
				var legacy = function() {
					try {
						var ta = document.createElement("textarea");
						ta.value = text;
						ta.style.position = "fixed";
						ta.style.opacity = "0";
						document.body.appendChild(ta);
						ta.select();
						var ok = document.execCommand("copy");
						document.body.removeChild(ta);
						if (ok) mark();
						else fail();
					} catch {
						fail();
					}
				};
				if (typeof navigator !== "undefined" && navigator.clipboard !== void 0 && typeof navigator.clipboard.writeText === "function") {
					navigator.clipboard.writeText(text).then(mark, legacy);
				} else {
					legacy();
				}
			}, []);
			var copyResult = useCallback(function() {
				copyText(result, "result");
			}, [copyText, result]);
			/** 开启本机历史：之前的记录（含授权前那次）一起落盘。 */
			var grantConsent = useCallback(function() {
				var base = pendingEntryRef.current !== null ? appendEntry(store, pendingEntryRef.current) : store;
				pendingEntryRef.current = null;
				var nextStore = { schemaVersion: HISTORY_SCHEMA, consent: "granted", entries: pruneEntries(base.entries) };
				writeHistoryStore(nextStore);
				setStore(nextStore);
				setConsentOpen(false);
			}, [store]);
			/** 不保存：清掉待定记录，之后也不再弹询问；历史视图里可重新开启。 */
			var declineConsent = useCallback(function() {
				pendingEntryRef.current = null;
				var nextStore = { schemaVersion: HISTORY_SCHEMA, consent: "declined", entries: [] };
				writeHistoryStore(nextStore);
				setStore(nextStore);
				setConsentOpen(false);
				setOpenId("");
				setChainView("");
			}, []);
			/** 删除单个版本：子版本上移一位，链条保持可走。 */
			var dropHistoryEntry = useCallback(function(id) {
				var next = dropEntry(store.entries, id);
				var nextStore = { schemaVersion: HISTORY_SCHEMA, consent: store.consent, entries: next };
				writeHistoryStore(nextStore);
				setStore(nextStore);
				if (openId === id) setOpenId("");
				if (chainView !== "" && chainOf(next, chainView).length === 0) setChainView("");
			}, [store, openId, chainView]);
			/** 清空全部：只清记录，不改授权状态。 */
			var wipeHistory = useCallback(function() {
				var nextStore = { schemaVersion: HISTORY_SCHEMA, consent: store.consent, entries: [] };
				writeHistoryStore(nextStore);
				setStore(nextStore);
				setOpenId("");
				setChainView("");
			}, [store]);
			/** 打开某条链的对比视图；中间列默认最新版本。 */
			var openCompare = useCallback(function(rootId) {
				setChainView(rootId);
				setCmpId("");
				setError("");
			}, []);
			/** 把历史里的某个版本写回输入框（不发送），面板收起。 */
			var restoreVersion = useCallback(function(entry) {
				if (inputActions === void 0 || typeof entry.output !== "string" || entry.output === "") return;
				inputActions.setDraft(entry.output);
				setOpen(false);
			}, [inputActions]);
			/**
			 * The version an iterate run builds on: the entry the panel last produced
			 * (matched by output), or the one restored from history. A fresh draft run
			 * starts a new chain.
			 */
			var baseEntry = useMemo(function() {
				if (result === "") return null;
				for (var j = store.entries.length - 1; j >= 0; j--) {
					if (store.entries[j].output === result) return store.entries[j];
				}
				return null;
			}, [result, store.entries]);
			var lastRunIdRef = useRef(null);
			/** The not-yet-persisted run waiting on the consent decision. */
			var pendingEntryRef = useRef(null);
			var busy = status === "running";
			/**
			 * The disable reason rides on the button itself — upstream's troubleshooting
			 * doc treats "为什么是灰的" as a first-class question, so a disabled control
			 * must name what is missing (empty draft / no feedback / catalog not loaded)
			 * instead of failing silently on click.
			 */
			var sourceNow = sourceFor(mode);
			var runBlock = template === null ? "模板目录还没载入" : typeof sourceNow !== "string" || sourceNow.trim() === "" ? "输入框里还没有内容可润色" : mode === "iterate" && feedback.trim() === "" ? "先填改进意见，再点开始迭代" : "";
			var canRun = runBlock === "";
			/** Doc-aligned result metadata: model, wall time, size, token usage. */
			var metaText = "";
			if (busy) {
				metaText = "生成中…";
			} else if (modelUsed !== "") {
				metaText = "模型 " + modelUsed;
				if (elapsedMs > 0) metaText += " · 耗时 " + (elapsedMs / 1000).toFixed(1) + "s";
				if (result !== "") metaText += " · " + result.length + " 字";
				if (usage !== null && typeof usage.inputTokens === "number" && typeof usage.outputTokens === "number") metaText += " · tok " + usage.inputTokens + "→" + usage.outputTokens;
			} else if (result !== "") {
				metaText = "已生成";
			}
			/**
			 * A living-flame seat, per the user's ask: it burns at rest — a warm
			 * radial body (red at the base, orange, a near-white core), two light
			 * layers breathing on offset 2.3s/3.9s cycles so the flicker never
			 * looks like a loop, and the whole pill brightening on a slower 3.4s
			 * breath. Hover hurries the fire up, a live run makes it dance fast.
			 * Fixed warm palette here on purpose: fire is warm in every theme;
			 * everything else in the panel still rides the theme tokens.
			 */
			var seat = h("span", {
				ref: seatRef,
				className: "pp-seatwrap",
				"data-open": open ? "1" : "0",
				"data-busy": busy ? "1" : "0"
			}, h("button", {
				type: "button",
				className: "pp-seat",
				title: "打开润色面板（不会自动生成；改好内容后点「生成」）",
				"aria-haspopup": "dialog",
				"aria-expanded": open,
				onMouseDown: function(event) {
					event.preventDefault();
					event.stopPropagation();
				},
				onClick: function() {
					if (busy) {
						setOpen(function(v) {
							return !v;
						});
						return;
					}
					if (open) {
						setOpen(false);
						return;
					}
					/**
					 * Opening is not generating. The panel opens on the compose view with
					 * the draft the composer already holds; the model call waits for 生成.
					 */
					setHistoryOpen(false);
					setError("");
					setOpen(true);
					/**
					 * Both composer picks present: the click is an explicit run with those
					 * settings, so it goes straight through the same guard as 生成. One
					 * missing pick keeps the manual flow.
					 */
					if (pin !== "" && effort !== "") run(mode, template);
				}
			}, h("span", { className: "pp-glyph" }, busy ? "⋯" : "✨"), h("span", null, busy ? "润色中" : "润色")), h("span", { className: "pp-seat-layer" }), h("span", { className: "pp-seat-layer" }), h("span", { className: "pp-seat-spark" }));
			/**
			 * One compact entry, not two permanent selects: the composer toolbar is
			 * shared with the conversation model seat, and two always-open pickers
			 * squeezed it. The entry shows only what is chosen; the controls live in
			 * a popover that closes after every pick.
			 */
						/** Root menu cells mirror the conversation model selector's 模型 / 推理等级 rows. */
			var modelLabel = pin === "" ? "未选择" : modelLabelOf(catalog, pin);
			var effortLabel = effort === "" ? "未选择" : effortLabelOf(catalog, pin, effort);
			var modelOptions = [h("button", {
				key: "pp-opt-none",
				type: "button",
				className: "pp-option",
				"data-on": pin === "" ? "1" : "0",
				onClick: function() {
					setPin("");
					writePin("");
					setPicksView("root");
					setPicksOpen(false);
				}
			}, h("span", { className: "pp-option-label" }, "未选择"), pin === "" ? h("span", { className: "pp-check" }, "✓") : null)];
			(catalog === null ? [] : catalog.groups).forEach(function(group) {
				modelOptions.push(h("div", { key: "pp-group-" + group.provider, className: "pp-group" }, group.name));
				group.models.forEach(function(entry) {
					var value = group.provider + "/" + entry.id;
					modelOptions.push(h("button", {
						key: "pp-opt-" + value,
						type: "button",
						className: "pp-option",
						"data-on": pin === value ? "1" : "0",
						onClick: function() {
							setPin(value);
							writePin(value);
							setEffort(function(current) {
								/* A new model may not offer the old ladder; drop a stale choice. */
								var allowed = effortChoices(catalog, value).map(function(choice) { return choice.id; });
								var next = allowed.indexOf(current) === -1 ? "" : current;
								if (next === "") writeEffort("");
								return next;
							});
							setPicksView("root");
							setPicksOpen(false);
						}
					}, h("span", { className: "pp-option-label" }, entry.name), pin === value ? h("span", { className: "pp-check" }, "✓") : null));
				});
			});
			var effortOptions = [h("button", {
				key: "pp-effort-none",
				type: "button",
				className: "pp-option",
				"data-on": effort === "" ? "1" : "0",
				onClick: function() {
					setEffort("");
					writeEffort("");
					setPicksView("root");
					setPicksOpen(false);
				}
			}, h("span", { className: "pp-option-label" }, "未选择"), effort === "" ? h("span", { className: "pp-check" }, "✓") : null)];
			effortChoices(catalog, pin).forEach(function(entry) {
				effortOptions.push(h("button", {
					key: "pp-effort-" + entry.id,
					type: "button",
					className: "pp-option",
					"data-on": effort === entry.id ? "1" : "0",
					onClick: function() {
						setEffort(entry.id);
						writeEffort(entry.id);
						setPicksView("root");
						setPicksOpen(false);
					}
				}, h("span", { className: "pp-option-label" }, entry.name), effort === entry.id ? h("span", { className: "pp-check" }, "✓") : null));
			});
			/** Icons: a stack + sparkle for the entry, chevrons for the menu rows. */
			var pickIcon = h("svg", { className: "pp-trigger-glyph", width: 15, height: 15, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", "stroke-width": 1.7, "stroke-linecap": "round", "stroke-linejoin": "round", "aria-hidden": "true" }, h("ellipse", { cx: 10, cy: 5.6, rx: 5.6, ry: 2.4 }), h("path", { d: "M4.4 5.6v5.6c0 1.33 2.5 2.4 5.6 2.4s5.6-1.07 5.6-2.4V5.6" }), h("path", { d: "M4.4 11.2v5.6c0 1.33 2.5 2.4 5.6 2.4" }), h("path", { d: "M17.4 15.4l.85 2 2 .85-2 .85-.85 2-.85-2-2-.85 2-.85z" }));
			var pickChevron = h("svg", { className: "pp-trigger-chevron", width: 12, height: 12, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", "stroke-width": 2, "stroke-linecap": "round", "stroke-linejoin": "round", "aria-hidden": "true" }, h("path", { d: "m6 9 6 6 6-6" }));
			var cellChevron = h("svg", { className: "pp-cell-chevron", width: 12, height: 12, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", "stroke-width": 2, "stroke-linecap": "round", "stroke-linejoin": "round", "aria-hidden": "true" }, h("path", { d: "m9 6 6 6-6 6" }));
			var picksSummary = pin === "" ? "润色模型" : modelLabelOf(catalog, pin);
			var picksButton = h("button", {
				type: "button",
				className: "pp-trigger",
				"data-open": picksOpen ? "1" : "0",
				"aria-haspopup": "dialog",
				"aria-expanded": picksOpen,
				title: "选择润色用的模型与推理等级（两项都选好后点润色会立即开始）",
				onMouseDown: function(event) {
					event.preventDefault();
					event.stopPropagation();
				},
				onClick: function() {
					setPicksView("root");
					setPicksOpen(function(value) {
						return !value;
					});
				}
			}, h("span", { className: "pp-trigger-icon", "aria-hidden": "true" }, pickIcon), h("span", { className: "pp-trigger-label" }, picksSummary), effort === "" ? null : h("span", { className: "pp-trigger-effort" }, effortLabelOf(catalog, pin, effort)), pickChevron);
			var picksBody;
			if (picksView === "model") {
				picksBody = [h("button", {
					key: "pp-back-model",
					type: "button",
					className: "pp-cell pp-cell-back",
					onClick: function() {
						setPicksView("root");
					}
				}, h("span", { className: "pp-cell-label" }, "‹ 模型")), h("div", { className: "pp-options" }, modelOptions)];
			} else if (picksView === "effort") {
				picksBody = [h("button", {
					key: "pp-back-effort",
					type: "button",
					className: "pp-cell pp-cell-back",
					onClick: function() {
						setPicksView("root");
					}
				}, h("span", { className: "pp-cell-label" }, "‹ 推理等级")), h("div", { className: "pp-options" }, effortOptions)];
			} else {
				picksBody = [h("button", {
					key: "pp-cell-model",
					type: "button",
					className: "pp-cell",
					onClick: function() {
						setPicksView("model");
					}
				}, h("span", { className: "pp-cell-label" }, "模型"), h("span", { className: "pp-cell-value" }, modelLabel), cellChevron), h("button", {
					key: "pp-cell-effort",
					type: "button",
					className: "pp-cell",
					onClick: function() {
						setPicksView("effort");
					}
				}, h("span", { className: "pp-cell-label" }, "推理等级"), h("span", { className: "pp-cell-value" }, effortLabel), cellChevron)];
			}
			var picksPopover = picksOpen ? h("div", {
				className: "pp-menu",
				role: "dialog",
				"aria-label": "润色模型与推理等级",
				style: popPos === null ? { position: "absolute", left: 0, bottom: "calc(100% + 6px)" } : { position: "fixed", left: popPos.left + "px", bottom: popPos.bottom + "px" }
			}, picksBody) : null;
			var composerRow = h("span", { className: "pp-picks", ref: picksRef }, picksButton, picksPopover, seat);
			if (!open) return composerRow;
			/**
			 * Polish model picker. Empty value means "follow the composer", which is
			 * the right default; the list exists so an image model in the composer
			 * does not silently break polishing.
			 */
			var picker = h("select", {
				key: "pp-model",
				className: "pp-sel",
				value: pin,
				disabled: busy,
				title: "润色用哪个模型（默认跟随输入框）",
				onChange: function(event) {
					setPin(event.target.value);
					writePin(event.target.value);
				}
			}, h("option", {
				value: ""
			}, catalog !== null && catalog.current ? "跟随当前 · " + catalog.current.model : "跟随当前模型"), catalog === null ? null : catalog.groups.map(function(group) {
				return h("optgroup", {
					key: group.provider,
					label: group.name
				}, group.models.map(function(entry) {
					return h("option", {
						key: group.provider + "/" + entry.id,
						value: group.provider + "/" + entry.id
					}, entry.name);
				}));
			}));
			/**
			 * Tab order comes from the catalog: the host orders `modes` so
			 * 用户提示词 precedes 系统提示词. The panel renders that order verbatim — one
			 * source of truth beats a second sort that can drift from it.
			 */
			/**
			 * Which template the chosen `optimizationMode` will use. Rendered even when
			 * the family holds one entry: showing the active template is information,
			 * and a family that gains templates needs no markup change.
			 */
			var tplSelect = h("select", {
				key: "pp-template",
				className: "pp-sel",
				value: template === null ? "" : template.id,
				disabled: busy || family.length === 0,
				title: "使用哪个优化模板",
				onChange: function(event) {
					for (var i = 0; i < family.length; i++) {
						if (family[i].id === event.target.value) {
							pickTemplate(family[i]);
							return;
						}
					}
				}
			}, family.length === 0 ? h("option", { value: "" }, "无可用模板") : family.map(function(entry) {
				return h("option", { key: entry.id, value: entry.id }, entry.label);
			}));
			/**
			 * History view: one card per finished run, newest first. The collapsed
			 * head already answers "what did I polish when"; expanding shows the
			 * two things the user asked to be able to reread — the input at that
			 * time and the optimized output — plus per-record 复制 / 写回输入框 /
			 * 删除. Records survive reloads (localStorage), capped at 50.
			 */
			/** 授权卡：首次成功生成后、写入磁盘前问一次，只问这一次。 */
			var consentCard = h("div", { className: "pp-consent" }, h("p", null, "润色历史只保存在这台设备上：记录输入、结果、模型和 token 消耗，不上传。可随时在历史页清空或删除单条。"), h("div", { className: "pp-hrow" }, h("button", {
				type: "button", className: "pp-btn pp-mini", "data-primary": "1", title: "开始在本机保存润色历史", onClick: grantConsent
			}, "开启历史"), h("button", {
				type: "button", className: "pp-btn pp-mini", title: "不保存历史（也不会再询问；可在历史页重新开启）", onClick: declineConsent
			}, "不保存")));
			/**
			 * History view: consent card first when undecided, then one card per
			 * version, newest first. Expanded cards expose the run's tokens and the
			 * chain actions — 对比版本链 / 删除此版 / 删除整条链 — so the version
			 * story and its cleanup live where the versions live.
			 */
			var historyView = h("div", { className: "pp-body pp-hist" },
				(store.consent === "unknown" && store.entries.length > 0) || consentOpen ? consentCard : null,
				store.consent === "declined" ? h("div", { className: "pp-consent" }, h("p", null, "历史记录已关闭，本机没有保存任何润色内容。"), h("div", { className: "pp-hrow" }, h("button", { type: "button", className: "pp-btn pp-mini", title: "开始在本机保存润色历史", onClick: grantConsent }, "开启历史"))) : null,
				store.consent !== "declined" && store.entries.length === 0 ? h("p", { className: "pp-note" }, "还没有润色记录。每完成一次生成，这里会存一条：当时的输入、结果和 token 消耗，重启后也还在。") : null,
				store.entries.map(function(entry, index) {
					var on = openId === entry.id;
					var snippet = String(entry.input || "").replace(/\s+/g, " ").slice(0, 26);
					return h("div", {
						key: entry.id + "-" + index,
						className: "pp-hitem"
					}, h("div", {
						className: "pp-hhead",
						title: "展开看这次润色的输入、结果和 token 消耗",
						onClick: function() {
							setOpenId(on ? "" : entry.id);
						}
					}, h("span", { className: "pp-htime" }, formatWhen(entry.at)), h("span", { className: "pp-hwhat" }, (entry.template || "润色") + " · " + snippet + (snippet.length >= 26 ? "…" : "")), on ? null : h("button", {
						type: "button",
						className: "pp-btn pp-mini",
						title: "删除这一条记录（展开后还有更多操作）",
						onClick: function(event) {
							event.stopPropagation();
							dropHistoryEntry(entry.id);
						}
					}, "删除"), h("span", { className: "pp-harrow" }, on ? "收起 ▴" : "展开 ▾")), on ? h("div", { className: "pp-hbody" }, h("p", { className: "pp-hlabel" }, "当时的输入"), h("pre", { className: "pp-hpre" }, entry.input), h("p", { className: "pp-hlabel" }, "优化后的结果"), h("pre", { className: "pp-hpre" }, entry.output), h("p", { className: "pp-usage" }, usageText(entry.usage)), h("div", { className: "pp-hrow" }, h("button", {
						type: "button", className: "pp-btn pp-mini", title: "把这条结果复制到剪贴板",
						onClick: function() { copyText(entry.output, entry.id); }
					}, copied === entry.id ? "已复制 ✓" : "复制结果"), h("button", {
						type: "button", className: "pp-btn pp-mini", title: "把这条结果写回输入框（不发送，供你自己检查）",
						onClick: function() { restoreVersion(entry); }
					}, "写回输入框"), h("button", {
						type: "button", className: "pp-btn pp-mini", title: "原稿与各版本的并排对比，附本机结构分析",
						onClick: function() { openCompare(entry.rootId); }
					}, "对比版本链"), h("button", {
						type: "button", className: "pp-btn pp-mini", title: "删除这一条版本（它的下一条会接回上一版）",
						onClick: function() { dropHistoryEntry(entry.id); }
					}, "删除此版"), h("button", {
						type: "button", className: "pp-btn pp-mini", title: "删除这条链上的全部版本（含原稿）",
						onClick: function() { setStore({ schemaVersion: HISTORY_SCHEMA, consent: store.consent, entries: dropChain(store.entries, entry.rootId) }); writeHistoryStore({ schemaVersion: HISTORY_SCHEMA, consent: store.consent, entries: dropChain(store.entries, entry.rootId) }); if (chainView === entry.rootId) setChainView(""); }
					}, "删除整条链"))) : null);
				}), store.entries.length > 0 && store.consent === "granted" ? h("div", { className: "pp-hrow" }, h("button", {
					type: "button", className: "pp-btn pp-mini", title: "清空所有历史记录（授权保持不变）",
					onClick: wipeHistory
				}, "清空全部")) : null);
			/**
			 * 对比版本链：原稿 | 所选版本 | 最新版本，三列并排；窄面板自动叠放。
			 * 结构变化摘要是本机确定性计算（长度/行数/角色标记），不冒充模型判断。
			 */
			var compareView = cmpEntry === null ? null : h("div", { className: "pp-body" },
				h("div", { className: "pp-cmpbar" },
					h("button", { type: "button", className: "pp-btn pp-mini", title: "回到历史列表", onClick: function() { setChainView(""); } }, "← 历史"),
					h("span", { className: "pp-note", style: { margin: "0" } }, "对比版本链 · " + formatWhen(cmpEntry.at)),
					chain.length > 1 ? h("select", {
						className: "pp-sel", value: cmpEntry.id, style: { marginLeft: "auto", maxWidth: "180px" },
						title: "选中间列显示哪个版本", onChange: function(event) { setCmpId(event.target.value); }
					}, chain.map(function(entry, index) {
						return h("option", { key: entry.id, value: entry.id }, "v" + (index + 1) + " · " + formatWhen(entry.at));
					})) : null
				),
				h("div", { className: "pp-cmp", "data-stack": anchor !== null && anchor.width < 760 ? "1" : "0" },
					h("div", { className: "pp-ccol" }, h("div", { className: "pp-chead" }, h("span", { className: "pp-ctitle" }, "原稿"), h("span", { className: "pp-csize" }, cmpAnalysis.beforeChars + " 字")), h("pre", { className: "pp-cbody" }, cmpOriginal)),
					h("div", { className: "pp-ccol" }, h("div", { className: "pp-chead" }, h("span", { className: "pp-ctitle" }, "所选版本"), h("span", { className: "pp-csize" }, cmpAnalysis.afterChars + " 字")), h("pre", { className: "pp-cbody" }, cmpEntry.output)),
					h("div", { className: "pp-ccol" }, h("div", { className: "pp-chead" }, h("span", { className: "pp-ctitle" }, "最新版本"), h("span", { className: "pp-csize" }, (chain[chain.length - 1].output || "").replace(/\s+/g, "").length + " 字")), h("pre", { className: "pp-cbody" }, chain[chain.length - 1].output))
				),
				h("div", { className: "pp-csum" },
					h("b", null, "结构变化（本机分析）"), "：输入 " + cmpAnalysis.beforeChars + " 字 → " + cmpAnalysis.afterChars + " 字；新增 " + cmpAnalysis.addedLines + " 行，删除 " + cmpAnalysis.removedLines + " 行" + (cmpAnalysis.approximate ? "（超长文本按行数估算）" : "") + "。",
					cmpAnalysis.gained.length > 0 ? h("span", null, "补上了 " + cmpAnalysis.gained.join("、") + "。") : null,
					cmpAnalysis.lost.length > 0 ? h("span", null, "丢了 " + cmpAnalysis.lost.join("、") + "。") : null,
					cmpAnalysis.gained.length === 0 && cmpAnalysis.lost.length === 0 ? h("span", null, "目标/背景/约束/输出格式 的覆盖没有变化。") : null,
					h("span", null, cmpUsage)
				)
			);
			var panel = h("div", {
				ref: panelRef,
				className: "pp-panel",
				role: "dialog",
				"aria-label": "提示词润色",
				style: anchor === null ? {
					display: "none"
				} : {
					left: anchor.left,
					width: anchor.width,
					bottom: anchor.bottom
				},
				onMouseDown: function(event) {
					event.stopPropagation();
				}
			}, h("div", { className: "pp-head" }, h("div", { className: "pp-tabs" }, modes.length === 0 ? h("span", { className: "pp-tab" }, "载入中…") : modes.map(function(entry) {
				return h("button", {
					key: entry.id,
					type: "button",
					className: "pp-tab",
					"data-on": mode === entry.id ? "1" : "0",
					title: "优化对象是" + entry.label,
					disabled: busy,
					onClick: function() {
						choose(entry.id);
					}
				}, entry.label);
			})), tplSelect, h("span", { className: "pp-spacer" }), h("button", {
				type: "button",
				className: "pp-btn pp-mini",
				"data-on": historyOpen ? "1" : "0",
				title: historyOpen ? "收起历史，回到当前润色" : "查看历史的输入和优化结果（每次成功生成自动记一条）",
				onClick: function() {
					setHistoryOpen(!historyOpen);
					setError("");
				}
			}, "历史"), h("button", {
				type: "button",
				className: "pp-x",
				title: "关闭",
				onClick: function() {
					setOpen(false);
				}
			}, "×")), historyOpen && chainView !== "" && compareView !== null ? compareView : historyOpen ? historyView : h("div", { className: "pp-body" }, error !== "" ? h("div", { className: "pp-err" }, error) : null, (store.consent === "unknown" || consentOpen) && status === "done" ? consentCard : null, mode === "iterate" ? h("div", null, h("p", { className: "pp-note" }, "在当前版本上继续改进（必填：说明这次要改什么）"), h("textarea", {
				className: "pp-ta",
				value: feedback,
				placeholder: "例如：再简洁一些；补一个输出示例；把语气改成面向新手……",
				onChange: function(event) {
					setFeedback(event.target.value);
				}
			})) : null, result !== "" ? h("div", { className: "pp-outbar" }, h("button", {
				type: "button",
				className: "pp-btn pp-mini",
				title: "把润色结果复制到剪贴板（不改动输入框、不发送）",
				onClick: copyResult
			}, copied === "result" ? "已复制 ✓" : "复制草稿")) : null, result !== "" && !busy ? h("p", { className: "pp-usage" }, usageText(usage)) : null, mode === "user" && result !== "" && !busy ? h("p", { className: "pp-usage" }, contextNote(contextInfo)) : null, h("div", { className: "pp-out", "data-placeholder": busy ? "正在生成……" : "还没有生成内容。" }, result, busy ? h("span", { className: "pp-caret" }) : null), extracting ? h("p", { className: "pp-note" }, "正在提取变量……") : null, vars !== null ? h("div", { className: "pp-vars" }, h("p", { className: "pp-note" }, vars.summary), h("ul", { className: "pp-vlist" }, (Array.isArray(vars.variables) ? vars.variables : []).map(function(entry, index) {
				return h("li", { key: `${entry.name}-${index}` }, h("code", null, `{{${entry.name}}}`), " = ", entry.value, entry.reason ? h("span", { className: "pp-vwhy" }, ` · ${entry.reason}`) : null);
			}))) : null), historyOpen ? null : h("div", { className: "pp-foot" }, h("span", { className: "pp-meta", title: metaText }, metaText), picker, panelEffort, h("span", { className: "pp-spacer" }), busy ? h("button", {
				type: "button",
				className: "pp-btn",
				title: "停止本次生成（已生成的部分会保留）",
				onClick: stop
			}, "停止") : h("button", {
				type: "button",
				className: "pp-btn",
				/**
				 * Must not require a previous result: entering the 迭代优化 family with
				 * nothing generated yet would otherwise be a dead end, even though
				 * iterating falls back to the draft as its base text. Disabled only for
				 * a missing precondition, and then the title names it.
				 */
				disabled: !canRun,
				title: canRun ? "按当前模板生成（只有点这里才会发起请求）" : runBlock,
				onClick: function() {
					run(mode, template);
				}
			}, result === "" ? "生成" : "重新生成"), result !== "" && !busy ? h("button", {
				type: "button",
				className: "pp-btn",
				title: "把润色结果写回输入框并直接发送（输入框忙时按回车语义排队）",
				onClick: send
			}, "发送草稿") : null, result !== "" && !busy ? h("button", {
				type: "button",
				className: "pp-btn",
				disabled: extracting,
				title: "让模型指出这份结果里哪些部分可以参数化（另一次调用，用上游的变量提取模板）",
				onClick: extract
			}, extracting ? "提取中…" : "提取变量") : null, vars !== null ? h("button", {
				type: "button",
				className: "pp-btn",
				/**
				 * The list and the substitution are separate outcomes: a span that no
				 * longer matches the text still leaves useful variable names, so the
				 * panel keeps them and disables only the write-back, naming why.
				 */
				disabled: typeof vars.templated !== "string",
				title: typeof vars.templated === "string" ? "把提取出的片段替换成 {{变量}} 占位并写回输入框，不发送" : vars.templatedError || "模型给出的位置对不上原文，无法套成模板。",
				onClick: applyTemplate
			}, "写回模板") : null, h("button", {
				type: "button",
				className: "pp-btn",
				"data-primary": "1",
				title: "把润色结果写回输入框，不发送，供你自己检查后再按回车",
				disabled: result === "" || busy,
				onClick: accept
			}, "替换草稿")));
			return h("div", { style: { display: "contents" } }, composerRow, panel);
		}
		//#endregion
		//#region strategy-dashboard
		/* ------------------------------------------------------------------ *
		 * 策略管理：离线演示页。纯本地配置，不接钱包、不下单、不读行情。
		 * 领域函数与源版 strategy-dashboard/model.mjs 一一对应，页面按宿主
		 * 的 slots 契约注册（sidebar.panellist + main），样式全部限定在
		 * .hdy-strategy 作用域内。
		 * ------------------------------------------------------------------ */
		var STRATEGY_STORAGE_KEY = "strategy-dashboard.config.v1";
		var STRATEGY_STORAGE_VERSION = 1;
		var STRATEGY_FIELDS = Object.freeze({
			maxBuyTax: { label: "最大买入税率 %", min: 0, max: 100, step: "0.1" },
			maxSellTax: { label: "最大卖出税率 %", min: 0, max: 100, step: "0.1" },
			maxBuyBnb: { label: "单笔买入上限 BNB", min: 0, exclusiveMin: true, step: "0.01" },
			buyPercent: { label: "买入总量 %", min: 0, max: 100, exclusiveMin: true, step: "0.1" },
			stopLossPercent: { label: "止损 %", min: -100, max: 0, step: "1" },
			takeProfitMarketCap: { label: "市值止盈 $", min: 0, exclusiveMin: true, step: "1000" },
			sellAt2xPercent: { label: "翻倍出本(x2)卖出 %", min: 0, max: 100, step: "1" },
			sellAt4xPercent: { label: "二段止盈(x4)卖出 %", min: 0, max: 100, step: "1" },
			followWindowSeconds: { label: "跟单窗口 秒", min: 0, exclusiveMin: true, step: "1" },
			noBuyExitSeconds: { label: "无买单平仓 秒", min: 0, exclusiveMin: true, step: "1" }
		});
		var STRATEGY_COMMON = ["maxBuyTax", "maxSellTax", "maxBuyBnb", "buyPercent"];
		var STRATEGY_TAKE_PROFIT = ["stopLossPercent", "takeProfitMarketCap", "sellAt2xPercent", "sellAt4xPercent"];
		var STRATEGY_LIST = Object.freeze([
			{ id: "A", name: "基础规则", description: "税率过滤 · 买 2% · 2x/4x 分批卖半 · 市值 $300K 卖半", fields: [...STRATEGY_COMMON, ...STRATEGY_TAKE_PROFIT], metrics: { pnl: 0.4412, pnlText: "0.4412 BNB", winRate: 100, trades: 6, open: 3, best: 300.4, worst: 300.2 } },
			{ id: "D", name: "1% 测滑点", description: "小仓 1% 测滑点", fields: [...STRATEGY_COMMON, ...STRATEGY_TAKE_PROFIT], metrics: { pnl: 0.4489, pnlText: "0.4489 BNB", winRate: 100, trades: 6, open: 3, best: 304.9, worst: 300.7 } },
			{ id: "E", name: "无人跟单秒跑", description: "跟单监测 · 无跟单/断流即平仓", fields: [...STRATEGY_COMMON, "followWindowSeconds", "noBuyExitSeconds"], metrics: { pnl: 0, pnlText: "0 BNB", winRate: 0, trades: 0, open: 0, best: 0, worst: 0 } }
		]);
		var STRATEGY_RANKINGS = Object.freeze([
			{ id: "K", name: "0xKevin 终极严选", pnl: "+3.0083 BNB", winRate: "0.0%", closed: 3, average: "-9.03%", best: "-6.50%" },
			{ id: "F", name: "资金流严选", pnl: "+0.4530 BNB", winRate: "100.0%", closed: 3, average: "306.27%", best: "+307.21%" },
			{ id: "D", name: "1% 测滑点", pnl: "+0.4489 BNB", winRate: "100.0%", closed: 3, average: "303.31%", best: "+304.91%" },
			{ id: "A", name: "基础规则", pnl: "+0.4412 BNB", winRate: "100.0%", closed: 3, average: "300.29%", best: "+300.36%" }
		]);
		function strategyDefaults() {
			return STRATEGY_LIST.map(function(entry) {
				return {
					id: entry.id,
					enabled: true,
					parameters: Object.assign({
						maxBuyTax: 8,
						maxSellTax: 10,
						maxBuyBnb: entry.id === "A" ? 0.3 : 0.15,
						buyPercent: entry.id === "A" ? 2 : 1
					}, entry.id === "E" ? { followWindowSeconds: 2, noBuyExitSeconds: 10 } : { stopLossPercent: -50, takeProfitMarketCap: 300000, sellAt2xPercent: 50, sellAt4xPercent: 50 })
				};
			});
		}
		function strategyIsRecord(value) {
			return value !== null && typeof value === "object" && !Array.isArray(value);
		}
		function strategyExactKeys(object, keys) {
			return strategyIsRecord(object) && Object.keys(object).length === keys.length && keys.every(function(key) { return Object.hasOwn(object, key); });
		}
		var STRATEGY_NUMERIC = /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/;
		function strategyNumberError(key, value, allowString) {
			var field = STRATEGY_FIELDS[key];
			if (allowString && typeof value === "string" && value.trim() === "") return "请输入数值";
			if (allowString && typeof value === "string" && !STRATEGY_NUMERIC.test(value.trim())) return "请输入有效的有限数值";
			if ((!allowString && typeof value !== "number") || (allowString && typeof value !== "number" && typeof value !== "string")) return "必须是数值类型";
			var number = Number(value);
			if (!Number.isFinite(number)) return "请输入有效的有限数值";
			if (number < field.min || (field.exclusiveMin && number === field.min)) return field.exclusiveMin ? "必须大于 " + field.min : "不能小于 " + field.min;
			if (field.max !== undefined && number > field.max) return "不能大于 " + field.max;
			return null;
		}
		function strategyValidateValues(id, enabled, parameters, allowString) {
			var strategy = STRATEGY_LIST.find(function(item) { return item.id === id; });
			var errors = {};
			if (!strategy) return { ok: false, errors: { _form: "未知策略" } };
			if (typeof enabled !== "boolean") errors._form = "运行状态必须是布尔值";
			if (!strategyExactKeys(parameters, strategy.fields)) return { ok: false, errors: Object.assign({}, errors, { _form: "参数字段必须完整且不能包含额外字段" }) };
			var values = {};
			for (var keyIndex = 0; keyIndex < strategy.fields.length; keyIndex += 1) {
				var key = strategy.fields[keyIndex];
				var error = strategyNumberError(key, parameters[key], allowString);
				if (error) errors[key] = error;
				else values[key] = Number(parameters[key]);
			}
			var ok = Object.keys(errors).length === 0;
			return ok ? { ok: true, errors, config: { id, enabled, parameters: values } } : { ok: false, errors };
		}
		function validateStrategyConfig(value, expectedId) {
			if (!strategyExactKeys(value, ["id", "enabled", "parameters"])) return { ok: false, errors: { _form: "配置必须只包含 id、enabled、parameters 字段" } };
			if (expectedId !== undefined && value.id !== expectedId) return { ok: false, errors: { _form: "策略 id 必须为 " + expectedId } };
			return strategyValidateValues(value.id, value.enabled, value.parameters, false);
		}
		function strategyDraftFromConfig(config) {
			return {
				enabled: config.enabled,
				parameters: Object.fromEntries(Object.entries(config.parameters).map(function(entry) { return [entry[0], String(entry[1])]; }))
			};
		}
		function createStrategyDrafts(configs) {
			var list = configs === undefined ? strategyDefaults() : configs;
			return Object.fromEntries(list.map(function(config) { return [config.id, strategyDraftFromConfig(config)]; }));
		}
		function validateStrategyDraft(id, draft) {
			if (!strategyIsRecord(draft)) return { ok: false, errors: { _form: "缺少策略草稿" } };
			return strategyValidateValues(id, draft.enabled, draft.parameters, true);
		}
		function validateAllStrategyDrafts(drafts) {
			var configs = [];
			var errors = {};
			for (var index = 0; index < STRATEGY_LIST.length; index += 1) {
				var id = STRATEGY_LIST[index].id;
				var result = validateStrategyDraft(id, drafts === undefined || drafts === null ? void 0 : drafts[id]);
				if (result.ok) configs.push(result.config);
				else errors[id] = result.errors;
			}
			return { ok: Object.keys(errors).length === 0, configs, errors };
		}
		function strategyValidateConfigList(configs) {
			if (!Array.isArray(configs) || configs.length !== STRATEGY_LIST.length) throw new TypeError("策略配置必须完整包含 A、D、E");
			return STRATEGY_LIST.map(function(entry) {
				var matches = configs.filter(function(config) { return config !== null && config !== undefined && config.id === entry.id; });
				if (matches.length !== 1) throw new TypeError("策略 id 缺失或重复：" + entry.id);
				var result = validateStrategyConfig(matches[0], entry.id);
				if (!result.ok) throw new TypeError(entry.id + "：" + Object.entries(result.errors).map(function(pair) { return (STRATEGY_FIELDS[pair[0]] === undefined ? "配置" : STRATEGY_FIELDS[pair[0]].label) + " " + pair[1]; }).join("；"));
				return result.config;
			});
		}
		function serializeStrategyState(configs) {
			return JSON.stringify({ version: STRATEGY_STORAGE_VERSION, configs: strategyValidateConfigList(configs) });
		}
		function parseStrategyState(raw) {
			if (raw === null || raw === undefined) return { configs: strategyDefaults(), recovered: false, error: null };
			try {
				var state = JSON.parse(raw);
				if (!strategyExactKeys(state, ["version", "configs"]) || state.version !== STRATEGY_STORAGE_VERSION) throw new TypeError("配置版本或结构无效");
				return { configs: strategyValidateConfigList(state.configs), recovered: false, error: null };
			} catch {
				return { configs: strategyDefaults(), recovered: true, error: "本地配置损坏或版本不兼容，已恢复截图默认值；请检查后重新保存。" };
			}
		}
		function mergeSavedStrategyConfig(saved, config) {
			var result = validateStrategyConfig(config);
			if (!result.ok) throw new TypeError("不能保存无效配置");
			return strategyValidateConfigList(saved.map(function(item) { return item.id === config.id ? result.config : item; }));
		}
		function isStrategyDraftDirty(draft, saved) {
			var result = validateStrategyDraft(saved.id, draft);
			return !result.ok || JSON.stringify(result.config) !== JSON.stringify(saved);
		}
		function strategyCsvCell(value) {
			var text = typeof value === "string" && /^[=+@\-\t\r]/.test(value) ? "'" + value : String(value === null || value === undefined ? "" : value);
			return /[",\r\n]/.test(text) ? "\"" + text.replaceAll("\"", "\"\"") + "\"" : text;
		}
		function buildStrategyCsv(configs) {
			var checked = strategyValidateConfigList(configs);
			var keys = Object.keys(STRATEGY_FIELDS);
			var header = ["strategy_id", "strategy_name", "enabled", "net_pnl_bnb", "win_rate_percent", "trades", "open_positions", "best_percent", "worst_percent"].concat(keys);
			var rows = checked.map(function(config) {
				var strategy = STRATEGY_LIST.find(function(item) { return item.id === config.id; });
				var metrics = strategy.metrics;
				return [config.id, strategy.name, config.enabled, metrics.pnl, metrics.winRate, metrics.trades, metrics.open, metrics.best, metrics.worst].concat(keys.map(function(key) { return config.parameters[key] === undefined ? "" : config.parameters[key]; }));
			});
			return "\uFEFF" + [header].concat(rows).map(function(row) { return row.map(strategyCsvCell).join(","); }).join("\r\n") + "\r\n";
		}
		function reviewStrategyConfigs(configs) {
			return strategyValidateConfigList(configs).map(function(config) {
				var strategy = STRATEGY_LIST.find(function(item) { return item.id === config.id; });
				var parameters = config.parameters;
				var checks = [];
				checks.push({ tone: "neutral", text: config.enabled ? "本地演示状态：运行中；不会触发真实交易。" : "本地演示状态：已暂停；复盘不会启用策略。" });
				if (strategy.metrics.trades === 0) checks.push({ tone: "warning", text: "无已平仓样本，无法评估胜率或收益表现。" });
				else checks.push({ tone: "warning", text: "仅有 3 笔已平仓截图样本，样本不足；100% 胜率不代表未来表现。" });
				if (parameters.maxBuyTax > 10 || parameters.maxSellTax > 10) checks.push({ tone: "warning", text: "税率容忍值高于 10%，请留意摩擦成本。" });
				else checks.push({ tone: "neutral", text: "买入/卖出税率上限已通过范围检查；不代表链上税率已验证。" });
				checks.push({ tone: "neutral", text: "单笔上限 " + parameters.maxBuyBnb + " BNB，买入总量 " + parameters.buyPercent + "%；未提供账户余额，无法计算实际风险敞口。" });
				if (config.id !== "E") {
					checks.push({ tone: parameters.stopLossPercent <= -50 ? "warning" : "neutral", text: "止损阈值 " + parameters.stopLossPercent + "%；阈值不保证成交价格，滑点和流动性风险未建模。" });
					var remaining = (1 - parameters.sellAt2xPercent / 100) * (1 - parameters.sellAt4xPercent / 100) * 100;
					checks.push({ tone: "neutral", text: "两段卖出分别按剩余仓位计算；触发后理论剩余 " + Number(remaining.toFixed(4)) + "%（未计市值止盈）。" });
				} else {
					checks.push({ tone: parameters.noBuyExitSeconds <= parameters.followWindowSeconds ? "warning" : "neutral", text: "跟单窗口 " + parameters.followWindowSeconds + " 秒，无买单平仓 " + parameters.noBuyExitSeconds + " 秒。" + (parameters.noBuyExitSeconds <= parameters.followWindowSeconds ? "平仓等待不大于跟单窗口，请人工检查。" : "本页面不接收链上跟单数据。") });
				}
				return { id: config.id, name: strategy.name, checks };
			});
		}
		//#endregion

		//#region strategy-dashboard-ui
		var STRATEGY_CSS = [
			".hdy-strategy{--hdy-bg:#f7f8fa;--hdy-surface:#fff;--hdy-text:#111827;--hdy-muted:#65717e;--hdy-border:#e1e5e9;--hdy-control-border:#7a8794;--hdy-accent:#08b59b;--hdy-accent-text:#087f70;--hdy-success:#24994e;--hdy-success-text:#237d44;--hdy-danger:#c53237;--hdy-warning:#a45819;--hdy-body:16px;--hdy-heading:19px;--hdy-card-pad:24px;--hdy-input-h:42px;container-type:inline-size;color:var(--hdy-text);background:var(--hdy-bg);font-family:'Microsoft YaHei','PingFang SC','Noto Sans SC',sans-serif;font-size:var(--hdy-body);line-height:1.5;height:100%;overflow:auto;padding:16px}",
			".hdy-strategy *{box-sizing:border-box}",
			".hdy-strategy .hdy-vh{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap;border:0}",
			".hdy-strategy .hdy-rankings{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:16px}",
			".hdy-strategy .hdy-rank{position:relative;min-width:0;border:1px solid var(--hdy-border);border-radius:16px;padding:16px 18px;background:var(--hdy-surface);box-shadow:0 1px 3px rgb(17 24 39 / 5%)}",
			".hdy-strategy .hdy-rank:first-child{border-color:transparent;background:linear-gradient(#fff,#fff) padding-box,linear-gradient(110deg,#2bcaaa 0%,#3abfc3 55%,#dcbb37 100%) border-box}",
			".hdy-strategy .hdy-rank-title{display:flex;align-items:center;gap:10px;margin:0 20px 6px 0;font-size:var(--hdy-heading);line-height:1.45;font-weight:700}",
			".hdy-strategy .hdy-rank-dot{width:10px;height:10px;border-radius:50%;background:#2ac46c;flex:0 0 auto}",
			".hdy-strategy .hdy-rank-no{position:absolute;top:12px;right:16px;color:#8b98a7;font-size:15px;font-weight:700}",
			".hdy-strategy .hdy-rank:first-child .hdy-rank-no{color:var(--hdy-warning)}",
			".hdy-strategy .hdy-rank-pnl{color:var(--hdy-success);margin:2px 0 0;font-family:'Segoe UI',sans-serif;font-size:28px;line-height:1.4;font-weight:750;font-variant-numeric:tabular-nums}",
			".hdy-strategy .hdy-rank-meta{display:flex;gap:5px 12px;flex-wrap:wrap;margin:2px 0 12px;color:var(--hdy-muted);white-space:nowrap}",
			".hdy-strategy .hdy-rank-meta strong,.hdy-strategy .hdy-rank-bottom strong{color:var(--hdy-text);font-weight:700}",
			".hdy-strategy .hdy-rank-bottom{display:flex;flex-wrap:wrap;gap:6px 12px;margin:0;color:var(--hdy-muted)}",
			".hdy-strategy .hdy-num{font-family:'Segoe UI','Microsoft YaHei',sans-serif;font-variant-numeric:tabular-nums}",
			".hdy-strategy .hdy-toolbar{display:flex;align-items:center;flex-wrap:wrap;gap:10px;margin:28px 0 16px}",
			".hdy-strategy .hdy-btn{min-height:44px;border:1px solid var(--hdy-border);border-radius:10px;padding:7px 16px;color:var(--hdy-text);background:var(--hdy-surface);font:inherit;font-weight:700;line-height:1.4;white-space:nowrap;cursor:pointer}",
			".hdy-strategy .hdy-btn:hover{background:#edf1f4;border-color:#c7cfd7}",
			".hdy-strategy .hdy-btn-primary{color:#fff;background:#111827;border-color:#111827}",
			".hdy-strategy .hdy-btn-primary:hover{background:#263244;border-color:#263244}",
			".hdy-strategy .hdy-btn-accent{color:#fff;background:var(--hdy-accent-text);border-color:var(--hdy-accent-text)}",
			".hdy-strategy .hdy-btn-accent:hover{background:#066c60;border-color:#066c60}",
			".hdy-strategy .hdy-save-state{margin-left:auto;color:var(--hdy-muted);font-size:12px}",
			".hdy-strategy .hdy-save-state[data-dirty='1']{color:var(--hdy-warning)}",
			".hdy-strategy .hdy-strategies{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));align-items:stretch;gap:20px}",
			".hdy-strategy .hdy-card{display:flex;flex-direction:column;min-width:0;padding:var(--hdy-card-pad);border:1px solid var(--hdy-border);border-radius:16px;background:var(--hdy-surface);box-shadow:0 1px 3px rgb(17 24 39 / 5%)}",
			".hdy-strategy .hdy-card-head{display:flex;align-items:center;gap:10px;margin-bottom:2px}",
			".hdy-strategy .hdy-card-title{font-size:var(--hdy-heading);font-weight:700;line-height:1.5;margin:0 auto 0 0}",
			".hdy-strategy .hdy-badge{flex:0 0 auto;color:var(--hdy-success-text);border:1px solid #bde8cc;border-radius:8px;padding:2px 10px;background:#effbf4;font-weight:700;font-size:.87em;white-space:nowrap}",
			".hdy-strategy .hdy-badge[data-paused='1']{color:var(--hdy-muted);border-color:var(--hdy-border);background:#f1f3f5}",
			".hdy-strategy .hdy-switch{display:flex;align-items:center;justify-content:center;width:58px;height:44px;border:0;padding:6px 0;background:transparent;flex:0 0 auto;cursor:pointer}",
			".hdy-strategy .hdy-switch-track{display:flex;align-items:center;width:54px;height:30px;padding:4px;border-radius:999px;background:var(--hdy-accent)}",
			".hdy-strategy .hdy-switch-knob{width:22px;height:22px;margin-left:auto;border-radius:50%;background:#fff;box-shadow:0 1px 3px rgb(17 24 39 / 12%)}",
			".hdy-strategy .hdy-switch[aria-checked='false'] .hdy-switch-track{background:#8b96a2}",
			".hdy-strategy .hdy-switch[aria-checked='false'] .hdy-switch-knob{margin-left:0}",
			".hdy-strategy .hdy-metrics{margin:0}",
			".hdy-strategy .hdy-metric{display:flex;align-items:baseline;justify-content:space-between;min-height:34px;gap:8px}",
			".hdy-strategy .hdy-metric dt{color:var(--hdy-muted);flex:0 0 auto}",
			".hdy-strategy .hdy-metric dd{margin:0;text-align:right}",
			".hdy-strategy .hdy-pnl{color:var(--hdy-success-text);font-weight:700}",
			".hdy-strategy .hdy-best{color:var(--hdy-muted);font-weight:700}",
			".hdy-strategy .hdy-worst{color:var(--hdy-danger);font-weight:700}",
			".hdy-strategy .hdy-desc{color:var(--hdy-muted);margin:0 0 14px;line-height:1.5;min-height:3em}",
			".hdy-strategy .hdy-form{display:flex;flex:1;flex-direction:column;margin:0}",
			".hdy-strategy .hdy-grid{display:flex;flex-direction:column;gap:12px}",
			".hdy-strategy .hdy-group{border:0;padding:0;margin:0;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;min-width:0}",
			".hdy-strategy .hdy-field{min-width:0;display:grid;grid-template-columns:minmax(0,1fr) minmax(70px,.92fr);align-items:center;column-gap:10px}",
			".hdy-strategy .hdy-field label{color:var(--hdy-muted);line-height:1.5;overflow-wrap:anywhere}",
			".hdy-strategy .hdy-input{width:100%;height:var(--hdy-input-h);min-width:0;border:1px solid var(--hdy-control-border);border-radius:9px;padding:6px 8px;color:var(--hdy-text);background:#fff;text-align:center;font:inherit;font-family:'Segoe UI','Microsoft YaHei',sans-serif;font-variant-numeric:tabular-nums;box-shadow:inset 0 1px 2px rgb(17 24 39 / 2%)}",
			".hdy-strategy .hdy-input:hover{border-color:var(--hdy-accent-text)}",
			".hdy-strategy .hdy-input:focus-visible{outline:2px solid var(--hdy-accent-text);outline-offset:3px}",
			".hdy-strategy .hdy-input[aria-invalid='true']{border-color:var(--hdy-danger);background:#fff8f8}",
			".hdy-strategy .hdy-field-error{grid-column:1 / -1;color:var(--hdy-danger);font-size:12px;padding-top:3px}",
			".hdy-strategy .hdy-card-error{color:var(--hdy-danger);font-size:13px;margin:12px 0 0}",
			".hdy-strategy .hdy-card-actions{display:flex;flex-wrap:wrap;align-items:center;gap:10px;margin-top:auto;padding-top:20px}",
			".hdy-strategy .hdy-card-actions .hdy-btn{padding:6px 13px}",
			".hdy-strategy .hdy-dirty{color:var(--hdy-warning);font-size:12px}",
			".hdy-strategy .hdy-page-error{padding:12px 16px;margin:0 0 16px;border:1px solid #ecc5c7;color:#a2282e;background:#fff5f5;border-radius:8px;font-size:14px}",
			".hdy-strategy .hdy-footer{padding:16px 0 4px;text-align:center;font-size:12px;color:var(--hdy-muted)}",
			".hdy-strategy .hdy-footer p{margin:2px 0}",
			".hdy-strategy .hdy-toast{position:fixed;z-index:60;right:20px;bottom:20px;max-width:min(500px,calc(100% - 40px));padding:12px 18px;border-radius:10px;background:#111827;color:#fff;box-shadow:0 4px 20px rgb(17 24 39 / 15%);font-size:14px}",
			".hdy-strategy .hdy-modal{position:fixed;inset:0;z-index:70;display:flex;align-items:center;justify-content:center;padding:24px;background:rgb(17 24 39 / 44%)}",
			".hdy-strategy .hdy-dialog{width:min(800px,calc(100vw - 32px));max-height:calc(100dvh - 48px);overflow:auto;border:1px solid var(--hdy-border);padding:24px;border-radius:16px;color:var(--hdy-text);background:var(--hdy-surface);box-shadow:0 20px 60px rgb(17 24 39 / 20%);font-size:15px}",
			".hdy-strategy .hdy-dialog-wide{width:min(1000px,calc(100vw - 32px))}",
			".hdy-strategy .hdy-dialog-head{display:flex;align-items:center;justify-content:space-between;gap:12px}",
			".hdy-strategy .hdy-dialog-head h2{margin:0;font-size:21px}",
			".hdy-strategy .hdy-close{display:grid;place-items:center;min-width:44px;min-height:44px;padding:0;border:0;border-radius:8px;background:transparent;color:var(--hdy-muted);font-size:30px;line-height:1;cursor:pointer}",
			".hdy-strategy .hdy-close:hover{background:#edf1f4}",
			".hdy-strategy .hdy-dialog-desc{margin:10px 0 18px;color:var(--hdy-muted)}",
			".hdy-strategy .hdy-dialog-actions{display:flex;justify-content:flex-end;flex-wrap:wrap;gap:10px;margin-top:20px}",
			".hdy-strategy .hdy-json-label{display:block;margin-bottom:8px;font-weight:700}",
			".hdy-strategy .hdy-json{display:block;resize:vertical;width:100%;min-height:340px;border:1px solid var(--hdy-control-border);border-radius:8px;padding:14px;font:14px/1.65 Consolas,monospace;color:var(--hdy-text);background:#fafbfc;tab-size:2}",
			".hdy-strategy .hdy-json[aria-invalid='true']{border-color:var(--hdy-danger)}",
			".hdy-strategy .hdy-dialog-error{color:var(--hdy-danger);margin:10px 0 0;white-space:pre-line}",
			".hdy-strategy .hdy-table-scroll{overflow:auto;border:1px solid var(--hdy-border);border-radius:8px;margin-top:12px}",
			".hdy-strategy .hdy-table{border-collapse:collapse;width:100%;min-width:520px;font-size:14px}",
			".hdy-strategy .hdy-table caption{text-align:left;padding:12px;font-weight:700;background:#f7f8fa}",
			".hdy-strategy .hdy-table th,.hdy-strategy .hdy-table td{padding:9px 12px;text-align:left;border-top:1px solid var(--hdy-border)}",
			".hdy-strategy .hdy-table thead th{background:#f7f8fa}",
			".hdy-strategy .hdy-sample{color:var(--hdy-warning);font-size:13px}",
			".hdy-strategy .hdy-review{padding:16px 0;border-top:1px solid var(--hdy-border)}",
			".hdy-strategy .hdy-review h3{margin:0 0 8px;font-size:17px}",
			".hdy-strategy .hdy-review ul{margin:0;padding-left:22px}",
			".hdy-strategy .hdy-review li{padding:4px 0}",
			".hdy-strategy .hdy-warn{color:var(--hdy-warning)}",
			"@container (min-width:1800px){.hdy-strategy{--hdy-body:22px;--hdy-heading:24px;--hdy-card-pad:30px;--hdy-input-h:52px}.hdy-strategy .hdy-rank-pnl{font-size:34px}.hdy-strategy .hdy-btn{min-height:56px;padding:8px 20px;font-size:24px}.hdy-strategy .hdy-switch{width:76px}.hdy-strategy .hdy-switch-track{width:76px;height:42px;padding:5px}.hdy-strategy .hdy-switch-knob{width:32px;height:32px}.hdy-strategy .hdy-input{font-size:24px;border-radius:11px}}",
			"@container (max-width:1100px){.hdy-strategy .hdy-rankings{grid-template-columns:repeat(2,minmax(0,1fr))}.hdy-strategy .hdy-strategies{grid-template-columns:repeat(2,minmax(0,1fr))}.hdy-strategy .hdy-save-state{width:100%;margin-left:0}}",
			"@container (max-width:760px){.hdy-strategy{--hdy-card-pad:20px;--hdy-input-h:44px;padding:12px}.hdy-strategy .hdy-rankings{gap:12px}.hdy-strategy .hdy-strategies{grid-template-columns:1fr;gap:16px}.hdy-strategy .hdy-desc{min-height:0;margin-bottom:20px}.hdy-strategy .hdy-dialog{padding:18px;max-height:calc(100dvh - 24px)}}",
			"@container (max-width:420px){.hdy-strategy .hdy-rankings{grid-template-columns:1fr}.hdy-strategy .hdy-group{grid-template-columns:1fr;gap:14px}.hdy-strategy .hdy-btn{flex:1 1 auto;padding:8px 12px;font-size:15px}}",
			"@media (prefers-reduced-motion: reduce){.hdy-strategy *{transition:none !important}}",
			".hdy-strategy .hdy-market{display:flex;flex-wrap:wrap;align-items:center;gap:8px 14px;margin:-6px 0 14px;padding:8px 12px;border:1px solid var(--hdy-border);border-radius:10px;background:var(--hdy-surface);font-size:12px;color:var(--hdy-muted)}",
			".hdy-strategy .hdy-market[data-status='error']{border-color:#ecc5c7;background:#fff5f5}",
			".hdy-strategy .hdy-market-row{display:inline-flex;gap:6px;align-items:baseline;font-variant-numeric:tabular-nums;color:var(--hdy-text)}",
			".hdy-strategy .hdy-up{color:var(--hdy-success)}",
			".hdy-strategy .hdy-down{color:var(--hdy-danger)}",
			".hdy-strategy .hdy-market-time{margin-left:auto}",
			".hdy-strategy .hdy-market-state{font-weight:700}",
			".hdy-strategy .hdy-market-source{font-weight:700;color:var(--hdy-text);white-space:nowrap}",
			".hdy-strategy .hdy-market-history{margin-top:-4px}",
			".hdy-strategy .hdy-market[data-stale='1']{border-color:#e6c98a;background:#fffaf0}",
			".hdy-strategy .hdy-agent-input{width:100%;min-height:84px;border:1px solid var(--hdy-control-border);border-radius:9px;padding:10px;font:inherit;background:#fff;color:var(--hdy-text)}",
			".hdy-strategy .hdy-agent-input:focus-visible{outline:2px solid var(--hdy-accent-text);outline-offset:3px}",
			".hdy-strategy .hdy-agent-result{margin-top:14px}",
			".hdy-strategy .hdy-agent-group{border-top:1px solid var(--hdy-border);padding:10px 0}",
			".hdy-strategy .hdy-agent-group h3{margin:0 0 6px;font-size:15px}",
			".hdy-strategy .hdy-agent-row{display:grid;grid-template-columns:auto minmax(0,.9fr) minmax(0,.7fr) minmax(0,1.4fr);gap:8px;align-items:start;padding:4px 0;font-size:13px}",
			".hdy-strategy .hdy-agent-diff{font-variant-numeric:tabular-nums;font-weight:700}",
			".hdy-strategy .hdy-agent-why{color:var(--hdy-muted)}",
			".hdy-strategy .hdy-agent-rejected{margin-top:10px}",
			".hdy-strategy .hdy-note{color:var(--hdy-muted);font-size:12.5px;margin:8px 0}"
		].join("\n");
		function ensureStrategyStyle() {
			if (typeof document === "undefined") return;
			if (document.querySelector("style[data-hdy-strategy-css]") !== null) return;
			var tag = document.createElement("style");
			tag.setAttribute("data-hdy-strategy-css", "");
			tag.textContent = STRATEGY_CSS;
			document.head.appendChild(tag);
		}
		function StrategyPanelIcon(props) {
			var size = props !== null && props !== undefined && typeof props.size === "number" ? props.size : 16;
			return h("svg", {
				width: size,
				height: size,
				viewBox: "0 0 16 16",
				fill: "currentColor",
				"aria-hidden": "true"
			}, h("path", { d: "M2 2.5h5v4H2zm7 0h5v2H9zm0 3h5v2H9zm-7 3h5v2H2zm0 3h5v3H2zm7-3h5v6H9z" }));
		}
		function StrategyModal(props) {
			useEffect(function() {
				function onKey(event) {
					if (event.key === "Escape") {
						event.stopPropagation();
						props.onClose();
					}
				}
				window.addEventListener("keydown", onKey, true);
				return function() { window.removeEventListener("keydown", onKey, true); };
			}, [props.onClose]);
			return h("div", { className: "hdy-modal", role: "presentation" }, h("div", {
				className: "hdy-dialog" + (props.wide === true ? " hdy-dialog-wide" : ""),
				role: "dialog",
				"aria-modal": "true",
				"aria-label": props.title
			}, h("div", { className: "hdy-dialog-head" }, h("h2", null, props.title), h("button", {
				type: "button",
				className: "hdy-close",
				"aria-label": "关闭" + props.title,
				onClick: props.onClose
			}, "×")), props.description === undefined ? null : h("p", { className: "hdy-dialog-desc" }, props.description), props.children, h("div", { className: "hdy-dialog-actions" }, props.footer)));
		}
		function StrategyTable(props) {
			return h("div", { className: "hdy-table-scroll" }, h("table", { className: "hdy-table" }, h("caption", null, props.caption), h("thead", null, h("tr", null, props.headers.map(function(label) {
				return h("th", { key: label, scope: "col" }, label);
			}))), h("tbody", null, props.rows.map(function(values, rowIndex) {
				return h("tr", { key: rowIndex }, values.map(function(value, index) {
					return index === 0 ? h("th", { key: index, scope: "row" }, String(value)) : h("td", { key: index }, String(value));
				}));
			}))));
		}
		function StrategyField(props) {
			var inputId = "hdy-field-" + props.strategyId + "-" + props.name;
			var errorId = inputId + "-error";
			return h("div", { className: "hdy-field" }, h("label", { htmlFor: inputId }, props.meta.label), h("input", {
				id: inputId,
				name: props.name,
				className: "hdy-input",
				type: "text",
				inputMode: props.meta.min < 0 ? "text" : "decimal",
				autoComplete: "off",
				spellCheck: false,
				value: props.value,
				"aria-invalid": props.error ? "true" : "false",
				"aria-describedby": errorId,
				"data-strategy-field": props.strategyId,
				onChange: function(event) { props.onChange(event.target.value); },
				onBlur: props.onBlur
			}), h("span", { id: errorId, className: "hdy-field-error", role: "alert", hidden: !props.error }, props.error || ""));
		}
		function StrategyCard(props) {
			var strategy = props.strategy;
			var draft = props.draft;
			var metrics = strategy.metrics;
			var errors = props.errors || {};
			var groupNames = ["税率过滤", "买入限额", strategy.id === "E" ? "跟单监测" : "风控参数", "分段止盈"];
			var groups = [];
			for (var start = 0; start < strategy.fields.length; start += 2) {
				groups.push(h("fieldset", { className: "hdy-group", key: start }, h("legend", { className: "hdy-vh" }, groupNames[start / 2]), strategy.fields.slice(start, start + 2).map(function(key) {
					return h(StrategyField, {
						key: key,
						strategyId: strategy.id,
						name: key,
						meta: STRATEGY_FIELDS[key],
						value: draft.parameters[key],
						error: errors[key],
						onChange: function(value) { props.onField(strategy.id, key, value); },
						onBlur: function() { props.onBlurField(strategy.id, key); }
					});
				})));
			}
			return h("article", { className: "hdy-card", "aria-labelledby": "hdy-title-" + strategy.id }, h("div", { className: "hdy-card-head" }, h("h2", { id: "hdy-title-" + strategy.id, className: "hdy-card-title" }, "策略 " + strategy.id + " · " + strategy.name), h("span", { className: "hdy-badge", "data-paused": draft.enabled ? "0" : "1" }, draft.enabled ? "运行中" : "已暂停"), h("button", {
				type: "button",
				className: "hdy-switch",
				role: "switch",
				"aria-checked": draft.enabled,
				"aria-label": "策略 " + strategy.id + " · " + strategy.name + " 本地运行状态",
				onClick: function() { props.onToggle(strategy.id); }
			}, h("span", { className: "hdy-switch-track", "aria-hidden": "true" }, h("span", { className: "hdy-switch-knob" })))), h("dl", { className: "hdy-metrics" }, h("div", { className: "hdy-metric" }, h("dt", null, "净盈亏"), h("dd", null, h("span", { className: "hdy-pnl hdy-num" }, metrics.pnlText))), h("div", { className: "hdy-metric" }, h("dt", null, "胜率 / 交易"), h("dd", null, h("span", { className: "hdy-num" }, metrics.winRate + "% · " + metrics.trades + " 笔 · 持仓 " + metrics.open))), h("div", { className: "hdy-metric" }, h("dt", null, "最佳 / 最差"), h("dd", null, h("span", { className: "hdy-num" }, h("span", { className: "hdy-best" }, metrics.best + "%"), " / ", h("span", { className: "hdy-worst" }, metrics.worst + "%"))))), h("p", { className: "hdy-desc" }, strategy.description), h("form", { className: "hdy-form", noValidate: true, "aria-label": "策略 " + strategy.id + " 参数", onSubmit: function(event) { event.preventDefault(); props.onSave(strategy.id); } }, h("div", { className: "hdy-grid" }, groups), h("p", { className: "hdy-card-error", role: "alert", hidden: !errors._form }, errors._form || ""), h("div", { className: "hdy-card-actions" }, h("button", { type: "submit", className: "hdy-btn hdy-btn-primary" }, "保存策略配置"), h("button", {
				type: "button",
				className: "hdy-btn",
				"aria-haspopup": "dialog",
				onClick: function(event) { props.onJson(strategy.id, event.currentTarget); }
			}, "原始 JSON"), props.dirty ? h("span", { className: "hdy-dirty" }, "未保存") : null)));
		}
		//#endregion

		//#region strategy-market-client
		var MARKET_TICKER_ROUTE = "/strategy/market/ticker";
		var MARKET_KLINES_ROUTE = "/strategy/market/klines";
		var STRATEGY_SUGGEST_ROUTE = "/strategy/suggest";
		var MARKET_SYMBOLS = ["BNBUSDT", "BTCUSDT", "ETHUSDT"];
		var MARKET_POLL_MS = 15000;
		var MARKET_KLINES_TTL_MS = 60000;
		var MARKET_KLINES_LIMIT = 168;
		/** 历史行情缓存：只在本页内存里，从不写入 strategy-dashboard.config.v1。 */
		var marketKlinesCache = new Map();

		function parseMarketTickers(payload) {
			if (payload === null || typeof payload !== "object" || !Array.isArray(payload.rows)) throw new Error("行情响应缺少 rows");
			return payload.rows.map(function(row) {
				if (typeof row.symbol !== "string" || !Number.isFinite(row.price)) throw new Error("行情行格式不合法");
				return { symbol: row.symbol, price: Number(row.price), changePercent: Number(row.changePercent), volume: Number(row.volume), quoteVolume: Number(row.quoteVolume), at: Number(row.at) };
			});
		}
		function parseMarketKlines(payload) {
			if (payload === null || typeof payload !== "object" || !Array.isArray(payload.candles)) throw new Error("K 线响应缺少 candles");
			return { symbol: String(payload.symbol), interval: String(payload.interval), at: Number(payload.at), count: payload.candles.length, summary: payload.summary };
		}
		/** 发送给模型的是摘要：价格、涨跌、波动率与时间范围，不含原始 K 线。 */
		function buildMarketSummary(rows, summaries) {
			if (rows.length === 0) return null;
			return {
				at: Math.max.apply(null, rows.map(function(row) { return row.at; })),
				symbols: rows.map(function(row) { return { symbol: row.symbol, price: row.price, changePercent: row.changePercent, quoteVolume: row.quoteVolume }; }),
				history: summaries.map(function(entry) { return entry.summary; }).filter(Boolean)
			};
		}
		/** 轮询 + 可见性暂停 + 指数退避重连；卸载时中止在途请求。 */
		function useStrategyMarket() {
			var marketState = useState({ status: "idle", rows: [], at: null, error: "" });
			var market = marketState[0];
			var setMarket = marketState[1];
			var summaryState = useState([]);
			var summaries = summaryState[0];
			var setSummaries = summaryState[1];
			useEffect(function() {
				var stopped = false;
				var timer = null;
				var backoff = 0;
				var controller = null;
				function schedule(ms) {
					if (stopped) return;
					timer = setTimeout(load, ms);
				}
				function load() {
					timer = null;
					if (stopped) return;
					if (typeof document !== "undefined" && document.visibilityState === "hidden") return;
					controller = new AbortController();
					fetch(MARKET_TICKER_ROUTE + "?symbols=" + MARKET_SYMBOLS.join(","), { credentials: "same-origin", signal: controller.signal }).then(function(response) {
						if (!response.ok) throw new Error("行情 HTTP " + response.status);
						return response.json();
					}).then(function(payload) {
						if (stopped) return;
						setMarket({ status: "live", rows: parseMarketTickers(payload), at: payload.at, error: "" });
						backoff = 0;
					}).catch(function(error) {
						if (stopped || (controller !== null && controller.signal.aborted)) return;
						setMarket(function(previous) { return { status: "error", rows: previous.rows, at: previous.at, error: error instanceof Error ? error.message : String(error) }; });
						backoff = backoff === 0 ? 5000 : Math.min(60000, backoff * 2);
					}).finally(function() {
						controller = null;
						schedule(backoff === 0 ? MARKET_POLL_MS : backoff);
					});
				}
				function onVisibility() {
					if (typeof document === "undefined") return;
					if (document.visibilityState === "visible") {
						if (timer !== null) { clearTimeout(timer); timer = null; }
						backoff = 0;
						load();
					} else if (timer !== null) {
						clearTimeout(timer);
						timer = null;
					}
				}
				if (typeof document !== "undefined") document.addEventListener("visibilitychange", onVisibility);
				load();
				return function() {
					stopped = true;
					if (timer !== null) clearTimeout(timer);
					if (typeof document !== "undefined") document.removeEventListener("visibilitychange", onVisibility);
					if (controller !== null) controller.abort();
				};
			}, []);
			useEffect(function() {
				var stopped = false;
				var collected = [];
				var pending = MARKET_SYMBOLS.slice();
				function next() {
					if (stopped || pending.length === 0) {
						if (!stopped) setSummaries(collected.slice());
						return;
					}
					var symbol = pending.shift();
					var key = "klines:" + symbol + ":1h:" + MARKET_KLINES_LIMIT;
					var cached = marketKlinesCache.get(key);
					if (cached !== undefined && Date.now() - cached.at < MARKET_KLINES_TTL_MS) {
						collected.push(cached.value);
						next();
						return;
					}
					fetch(MARKET_KLINES_ROUTE + "?symbol=" + symbol + "&interval=1h&limit=" + MARKET_KLINES_LIMIT, { credentials: "same-origin" }).then(function(response) {
						if (!response.ok) throw new Error("历史行情 HTTP " + response.status);
						return response.json();
					}).then(function(payload) {
						var parsed = parseMarketKlines(payload);
						marketKlinesCache.set(key, { at: Date.now(), value: parsed });
						collected.push(parsed);
					}).catch(function() {
						/* 历史行情失败不阻塞页面；摘要缺失即可。 */
					}).finally(next);
				}
				next();
				return function() { stopped = true; };
			}, []);
			return { market, summaries };
		}
		//#endregion

		//#region strategy-agent
		function validateStrategySuggestion(drafts, suggestion) {
			if (suggestion === null || typeof suggestion !== "object") return { ok: false, reason: "建议格式不合法" };
			var id = suggestion.strategyId;
			var strategy = STRATEGY_LIST.find(function(item) { return item.id === id; });
			if (strategy === undefined) return { ok: false, reason: "未知策略：" + String(id) };
			var field = suggestion.field;
			if (typeof field !== "string" || !Object.hasOwn(STRATEGY_FIELDS, field)) return { ok: false, reason: "未知字段：" + String(field) };
			if (!strategy.fields.includes(field)) return { ok: false, reason: "策略 " + id + " 没有字段 " + field };
			var value = suggestion.value;
			if (typeof value !== "number" || !Number.isFinite(value)) return { ok: false, reason: "建议值必须是有限数字" };
			var draft = drafts[id];
			var parameters = Object.assign({}, draft.parameters);
			parameters[field] = String(value);
			var result = validateStrategyDraft(id, { enabled: draft.enabled, parameters });
			if (!result.ok) return { ok: false, reason: result.errors[field] || result.errors._form || "未通过字段校验" };
			return {
				ok: true,
				id,
				field,
				value,
				from: draft.parameters[field],
				reason: typeof suggestion.reason === "string" ? suggestion.reason : "",
				impact: typeof suggestion.impact === "string" ? suggestion.impact : ""
			};
		}
		/** 返回新 drafts；只改被勾选的字段，不写存储、不动 enabled。 */
		function applyStrategySuggestions(drafts, items) {
			var next = Object.assign({}, drafts);
			items.forEach(function(item) {
				var draft = next[item.id];
				var parameters = Object.assign({}, draft.parameters);
				parameters[item.field] = String(item.value);
				next[item.id] = { enabled: draft.enabled, parameters };
			});
			return next;
		}
		/** 发给模型的载荷：本地草稿、与已存值的差异、排行、复盘、行情摘要。 */
		function buildStrategyAgentPayload(drafts, saved, rankings, review, marketSummary, instruction) {
			var strategies = STRATEGY_LIST.map(function(strategy) {
				return { id: strategy.id, enabled: drafts[strategy.id].enabled, parameters: drafts[strategy.id].parameters };
			});
			var savedDifferences = [];
			saved.forEach(function(config) {
				var draft = drafts[config.id];
				var strategy = STRATEGY_LIST.find(function(item) { return item.id === config.id; });
				var changed = {};
				strategy.fields.forEach(function(key) {
					if (String(draft.parameters[key]) !== String(config.parameters[key])) changed[key] = { current: draft.parameters[key], saved: config.parameters[key] };
				});
				if (draft.enabled !== config.enabled || Object.keys(changed).length > 0) savedDifferences.push({ id: config.id, enabled: { current: draft.enabled, saved: config.enabled }, changed });
			});
			return { instruction, strategies, savedDifferences, rankings, review, market: marketSummary };
		}
		function StrategyAgentDialog(props) {
			var instructionState = useState("");
			var instruction = instructionState[0];
			var setInstruction = instructionState[1];
			var busyState = useState(false);
			var busy = busyState[0];
			var setBusy = busyState[1];
			var errorState = useState("");
			var error = errorState[0];
			var setError = errorState[1];
			var resultState = useState(null);
			var result = resultState[0];
			var setResult = resultState[1];
			var selectedState = useState({});
			var selected = selectedState[0];
			var setSelected = selectedState[1];
			function submit() {
				if (busy) return;
				if (instruction.trim() === "") {
					setError("请先描述你想怎么调整，例如「降低 A 策略的风险」");
					return;
				}
				setBusy(true);
				setError("");
				setResult(null);
				var summary = buildMarketSummary(props.market.rows, props.summaries);
				var payload = buildStrategyAgentPayload(props.drafts, props.saved, STRATEGY_RANKINGS, props.review, summary, instruction.trim());
				fetch(STRATEGY_SUGGEST_ROUTE, {
					method: "POST",
					headers: { "content-type": "application/json" },
					credentials: "same-origin",
					body: JSON.stringify(payload)
				}).then(function(response) {
					return response.json().catch(function() { return {}; }).then(function(body) {
						if (!response.ok || body.ok !== true) throw new Error(body.message === undefined ? "AI 建议请求失败（HTTP " + response.status + "）" : body.message);
						return body;
					});
				}).then(function(body) {
					var accepted = [];
					var rejected = [];
					(Array.isArray(body.suggestions) ? body.suggestions : []).forEach(function(suggestion) {
						var checked = validateStrategySuggestion(props.drafts, suggestion);
						if (checked.ok) accepted.push(checked);
						else rejected.push({ suggestion, reason: checked.reason });
					});
					var picked = {};
					accepted.forEach(function(item) { picked[item.id + ":" + item.field] = true; });
					setSelected(picked);
					setResult({ accepted, rejected, usedMarket: body.usedMarket === true, model: body.model, market: summary !== null });
				}).catch(function(cause) {
					setError(cause instanceof Error ? cause.message : String(cause));
				}).finally(function() {
					setBusy(false);
				});
			}
			function chosenItems() {
				return result.accepted.filter(function(item) { return selected[item.id + ":" + item.field] === true; });
			}
			var body = h("div", null, h("p", { className: "hdy-dialog-desc" }, "描述你的调整目标，AI 会结合当前草稿、收益排行、本地复盘与行情摘要给出逐项建议。建议只写回表单草稿，仍需你手动保存。"), h("textarea", {
				className: "hdy-agent-input",
				placeholder: "例如：降低 A 策略的风险；参考收益排行优化 D 的止盈止损；结合近 30 天波动调整 E",
				value: instruction,
				disabled: busy,
				onChange: function(event) { setInstruction(event.target.value); }
			}), busy ? h("p", { className: "hdy-note" }, "正在生成建议…") : null, error === "" ? null : h("p", { className: "hdy-dialog-error", role: "alert" }, error), result === null ? null : h("div", { className: "hdy-agent-result" }, h("p", { className: "hdy-note" }, "模型 " + String(result.model) + (result.usedMarket ? " · 已使用行情摘要" : " · 未使用行情数据")), result.accepted.length === 0 ? h("p", { className: "hdy-note" }, "没有可直接应用的合法建议。") : h("div", null, STRATEGY_LIST.map(function(strategy) {
				var rows = result.accepted.filter(function(item) { return item.id === strategy.id; });
				if (rows.length === 0) return null;
				return h("section", { key: strategy.id, className: "hdy-agent-group" }, h("h3", null, "策略 " + strategy.id + " · " + strategy.name), rows.map(function(item) {
					var key = item.id + ":" + item.field;
					return h("label", { key, className: "hdy-agent-row" }, h("input", {
						type: "checkbox",
						checked: selected[key] === true,
						onChange: function() { setSelected(function(previous) { return Object.assign({}, previous, { [key]: previous[key] !== true }); }); }
					}), h("span", { className: "hdy-agent-field" }, STRATEGY_FIELDS[item.field].label), h("span", { className: "hdy-agent-diff" }, String(item.from) + " → " + String(item.value)), h("span", { className: "hdy-agent-why" }, item.reason + (item.impact === "" ? "" : "（预期：" + item.impact + "）")));
				}));
			})), result.rejected.length === 0 ? null : h("div", { className: "hdy-agent-rejected" }, h("p", { className: "hdy-note" }, "被拒绝的建议：" + result.rejected.length + " 条"), result.rejected.map(function(row, index) {
				return h("p", { key: index, className: "hdy-warn" }, String(row.suggestion && row.suggestion.strategyId) + " · " + String(row.suggestion && row.suggestion.field) + "：" + row.reason);
			}))));
			var footer = [h("button", { key: "discard", type: "button", className: "hdy-btn", onClick: props.onClose, disabled: busy }, "放弃")];
			if (result !== null && result.accepted.length > 0) {
				footer.push(h("button", { key: "all", type: "button", className: "hdy-btn", onClick: function() { props.onApply(result.accepted); }, disabled: busy }, "全部应用"));
				footer.push(h("button", { key: "picked", type: "button", className: "hdy-btn hdy-btn-primary", onClick: function() { props.onApply(chosenItems()); }, disabled: busy || chosenItems().length === 0 }, "应用所选"));
			} else {
				footer.push(h("button", { key: "send", type: "button", className: "hdy-btn hdy-btn-primary", onClick: submit, disabled: busy }, busy ? "生成中…" : "生成建议"));
			}
			return h(StrategyModal, { title: "AI 参数建议", description: "演示模式：只给参数建议，不下单、不连接钱包。", wide: true, onClose: props.onClose, footer }, body);
		}
		//#endregion

		//#region strategy-dashboard-page
		function StrategyJsonDialog(props) {
			var initial = useMemo(function() {
				var result = validateStrategyDraft(props.strategyId, props.draft);
				if (result.ok) return JSON.stringify(result.config, null, 2);
				var parameters = {};
				for (var entry of Object.entries(props.draft.parameters)) {
					parameters[entry[0]] = result.errors[entry[0]] === undefined ? Number(entry[1]) : entry[1];
				}
				return JSON.stringify({ id: props.strategyId, enabled: props.draft.enabled, parameters }, null, 2);
			}, []);
			var textState = useState(initial), text = textState[0], setText = textState[1];
			var errorState = useState(""), error = errorState[0], setError = errorState[1];
			function apply() {
				var result;
				try {
					result = validateStrategyConfig(JSON.parse(text), props.strategyId);
				} catch {
					result = { ok: false, errors: { _form: "JSON 格式错误，请检查引号、逗号和括号。" } };
				}
				if (!result.ok) {
					setError(Object.entries(result.errors).map(function(entry) {
						var meta = STRATEGY_FIELDS[entry[0]];
						return (meta === undefined ? "" : meta.label + "：") + entry[1];
					}).join("\n"));
					return;
				}
				props.onApply(result.config);
			}
			return h(StrategyModal, {
				title: "策略 " + props.strategyId + " · 原始 JSON",
				description: "编辑当前策略配置，应用只更新表单；请另行保存策略配置。运行状态仅为本地演示。",
				onClose: props.onClose,
				footer: [h("button", { key: "cancel", type: "button", className: "hdy-btn", onClick: props.onClose }, "取消"), h("button", { key: "apply", type: "button", className: "hdy-btn hdy-btn-primary", onClick: apply }, "应用到表单")]
			}, h("label", { className: "hdy-json-label", htmlFor: "hdy-json-editor" }, "策略配置 JSON"), h("textarea", {
				id: "hdy-json-editor",
				className: "hdy-json",
				spellCheck: false,
				value: text,
				"aria-invalid": error === "" ? "false" : "true",
				"aria-describedby": "hdy-json-error",
				onChange: function(event) { setText(event.target.value); }
			}), h("p", { id: "hdy-json-error", className: "hdy-dialog-error", role: "alert", hidden: error === "" }, error));
		}
		function StrategyStatsDialog(props) {
			var configs = props.configs;
			var rows = configs.map(function(config) {
				var strategy = STRATEGY_LIST.find(function(item) { return item.id === config.id; });
				var metrics = strategy.metrics;
				return [config.id + " · " + strategy.name, config.enabled ? "运行中（本地）" : "已暂停（本地）", metrics.pnlText, metrics.winRate + "%", metrics.trades, metrics.open, metrics.best + "% / " + metrics.worst + "%"];
			});
			var parameterRows = Object.entries(STRATEGY_FIELDS).map(function(entry) {
				return [entry[1].label].concat(configs.map(function(config) {
					return Object.hasOwn(config.parameters, entry[0]) ? config.parameters[entry[0]] : "不适用";
				}));
			});
			return h(StrategyModal, {
				title: "统计特征库",
				description: "当前 3 个策略的表单快照与截图演示指标。不是实时数据库；不包含行情、账户或链上特征。未保存参数也包含在此快照中。",
				wide: true,
				onClose: props.onClose,
				footer: h("button", { type: "button", className: "hdy-btn hdy-btn-primary", onClick: props.onClose }, "关闭")
			}, h(StrategyTable, { headers: ["策略", "本地状态", "净盈亏", "胜率", "交易", "持仓", "最佳 / 最差"], rows, caption: "截图演示指标 · 3 个策略" }), h("p", { className: "hdy-sample" }, "样本局限：A、D 各 3 笔已平仓；交易数含持仓。E 无已平仓样本，0% 不代表已验证胜率。所有指标保持参考截图口径，不随参数编辑重算收益。"), h(StrategyTable, { headers: ["参数", "策略 A", "策略 D", "策略 E"], rows: parameterRows, caption: "当前表单参数 · 含未保存修改" }));
		}
		function StrategyReviewDialog(props) {
			return h(StrategyModal, {
				title: "本地规则复盘",
				description: "检查已完成：仅对当前表单执行本地规则检查，非 AI 优化或收益承诺。不自动修改配置、不启停策略、不执行交易。",
				onClose: props.onClose,
				footer: h("button", { type: "button", className: "hdy-btn hdy-btn-primary", onClick: props.onClose }, "完成")
			}, props.sections.map(function(section) {
				return h("section", { className: "hdy-review", key: section.id }, h("h3", null, "策略 " + section.id + " · " + section.name), h("ul", null, section.checks.map(function(check, index) {
					return h("li", { key: index, className: check.tone === "warning" ? "hdy-warn" : "" }, check.text);
				})));
			}));
		}
		function StrategyPage() {
			ensureStrategyStyle();
			var marketState = useStrategyMarket();
			var market = marketState.market;
			var marketSummaries = marketState.summaries;
			var agentState = useState(false);
			var agentOpen = agentState[0];
			var setAgentOpen = agentState[1];
			var boot = useMemo(function() {
				try {
					return parseStrategyState(localStorage.getItem(STRATEGY_STORAGE_KEY));
				} catch {
					return { configs: strategyDefaults(), recovered: false, error: "无法读取浏览器本地存储，已载入截图默认值。修改仍可使用；保存失败时将保留草稿。" };
				}
			}, []);
			var savedState = useState(boot.configs), saved = savedState[0], setSaved = savedState[1];
			var draftsState = useState(function() { return createStrategyDrafts(boot.configs); }), drafts = draftsState[0], setDrafts = draftsState[1];
			var pageErrorState = useState(boot.error === null ? "" : boot.error || ""), pageError = pageErrorState[0], setPageError = pageErrorState[1];
			var toastState = useState(""), toast = toastState[0], setToast = toastState[1];
			var savedAtState = useState(null), savedAt = savedAtState[0], setSavedAt = savedAtState[1];
			var cardErrorsState = useState({}), cardErrors = cardErrorsState[0], setCardErrors = cardErrorsState[1];
			var dialogState = useState(null), dialog = dialogState[0], setDialog = dialogState[1];
			var triggerRef = useRef(null);
			var toastTimer = useRef(null);
			var rootRef = useRef(null);
			useEffect(function() {
				return function() { if (toastTimer.current !== null) clearTimeout(toastTimer.current); };
			}, []);
			function notify(message) {
				if (toastTimer.current !== null) clearTimeout(toastTimer.current);
				setToast(message);
				toastTimer.current = setTimeout(function() { setToast(""); toastTimer.current = null; }, 6500);
			}
			function closeDialog() {
				setDialog(null);
				var trigger = triggerRef.current;
				if (trigger !== null && typeof trigger.focus === "function") setTimeout(function() { trigger.focus(); }, 0);
			}
			function openDialog(next, trigger) {
				triggerRef.current = trigger === undefined ? null : trigger;
				setDialog(next);
			}
			function setDraft(id, mutate) {
				setDrafts(function(previous) {
					var draft = previous[id];
					var next = { enabled: draft.enabled, parameters: Object.assign({}, draft.parameters) };
					mutate(next);
					return Object.assign({}, previous, { [id]: next });
				});
			}
			function setCardError(id, errors) {
				setCardErrors(function(previous) { return Object.assign({}, previous, { [id]: errors }); });
			}
			function setFieldError(id, key, message) {
				setCardErrors(function(previous) {
					var current = Object.assign({}, previous[id] || {});
					if (message) current[key] = message;
					else delete current[key];
					return Object.assign({}, previous, { [id]: current });
				});
			}
			function focusFirstInvalid() {
				if (typeof document === "undefined") return;
				var node = document.querySelector(".hdy-strategy [data-strategy-field][aria-invalid='true']");
				if (node !== null) node.focus();
			}
			function persist(configs, message) {
				try {
					localStorage.setItem(STRATEGY_STORAGE_KEY, serializeStrategyState(configs));
				} catch {
					setPageError("保存失败：浏览器本地存储不可用或空间不足。草稿已保留，请勿刷新；可导出 CSV 留存当前有效参数。");
					notify("保存失败，草稿未丢失，尚未写入本地存储。");
					return false;
				}
				setSaved(configs);
				setSavedAt(new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" }));
				setPageError("");
				notify(message + "（仅当前浏览器）");
				return true;
			}
			function saveOne(id) {
				var result = validateStrategyDraft(id, drafts[id]);
				setCardError(id, result.errors);
				if (!result.ok) {
					notify("策略 " + id + " 保存失败，请检查标红字段。");
					setTimeout(focusFirstInvalid, 0);
					return;
				}
				persist(mergeSavedStrategyConfig(saved, result.config), "策略 " + id + " 配置已保存至本地");
			}
			function validatedCurrent(actionName) {
				var result = validateAllStrategyDrafts(drafts);
				var nextErrors = {};
				STRATEGY_LIST.forEach(function(entry) { nextErrors[entry.id] = result.errors[entry.id] || {}; });
				setCardErrors(nextErrors);
				if (!result.ok) {
					notify(actionName + "失败，请先修正标红的参数。");
					setTimeout(focusFirstInvalid, 0);
					return null;
				}
				return result.configs;
			}
			function exportCsv() {
				var configs = validatedCurrent("导出");
				if (configs === null) return;
				var url;
				try {
					var blob = new Blob([buildStrategyCsv(configs)], { type: "text/csv;charset=utf-8" });
					url = URL.createObjectURL(blob);
					var link = document.createElement("a");
					link.href = url;
					link.download = "features.csv";
					document.body.appendChild(link);
					link.click();
					link.remove();
					notify("已导出 features.csv：3 个策略，包含当前表单参数和截图演示指标。");
				} catch {
					setPageError("导出失败：浏览器未能创建 CSV 下载文件。配置和草稿保持不变。");
				} finally {
					if (url) setTimeout(function() { URL.revokeObjectURL(url); }, 1000);
				}
			}
			function openJson(id, trigger) {
				openDialog({ kind: "json", id }, trigger);
			}
			function applyJson(config) {
				var id = config.id;
				setDrafts(function(previous) { return Object.assign({}, previous, { [id]: strategyDraftFromConfig(config) }); });
				setCardError(id, {});
				notify("策略 " + id + " JSON 已应用到表单；请保存策略配置。");
				closeDialog();
			}
			function openStats(trigger) {
				var configs = validatedCurrent("统计");
				if (configs === null) return;
				openDialog({ kind: "stats", configs }, trigger);
			}
			function openReview(trigger) {
				var configs = validatedCurrent("本地复盘");
				if (configs === null) return;
				openDialog({ kind: "review", sections: reviewStrategyConfigs(configs) }, trigger);
			}
			/** 当前草稿先过校验，合法才作为复盘的输入；非法时复盘为空，不影响建议。 */
			var agentReview = (function() {
				var checked = validateAllStrategyDrafts(drafts);
				return checked.ok ? reviewStrategyConfigs(checked.configs) : [];
			})();
			function applyAgentSuggestions(items) {
				if (items.length === 0) return;
				setDrafts(function(previous) { return applyStrategySuggestions(previous, items); });
				notify("已把 " + items.length + " 条建议写入草稿（尚未保存）");
				closeDialog();
			}
			var dirtyCount = 0;
			saved.forEach(function(config) {
				if (isStrategyDraftDirty(drafts[config.id], config)) dirtyCount += 1;
			});
			var saveStateText = dirtyCount > 0 ? "未保存 · " + dirtyCount + " 个策略" : savedAt ? "已保存至本地 · " + savedAt : "本地演示";
			var rankings = STRATEGY_RANKINGS.map(function(rank, index) {
				return h("article", { className: "hdy-rank", key: rank.id }, h("h2", { className: "hdy-rank-title" }, h("span", { className: "hdy-rank-dot", "aria-hidden": "true" }), h("span", null, "策略 " + rank.id + " · " + rank.name)), h("span", { className: "hdy-rank-no hdy-num" }, "#" + (index + 1)), h("p", { className: "hdy-rank-pnl" }, rank.pnl), h("p", { className: "hdy-rank-meta" }, h("span", null, "胜率 ", h("strong", { className: "hdy-num" }, rank.winRate)), h("span", null, "已平 ", h("strong", { className: "hdy-num" }, String(rank.closed)), " 笔"), h("span", null, "平均 ", h("strong", { className: "hdy-num" }, rank.average))), h("p", { className: "hdy-rank-bottom" }, h("span", null, "最大暴击 ", h("strong", { className: "hdy-num" }, rank.best)), h("span", null, "运行中")));
			});
			var cards = STRATEGY_LIST.map(function(strategy) {
				return h(StrategyCard, {
					key: strategy.id,
					strategy,
					draft: drafts[strategy.id],
					errors: cardErrors[strategy.id],
					dirty: isStrategyDraftDirty(drafts[strategy.id], saved.find(function(config) { return config.id === strategy.id; })),
					onField: function(id, key, value) { setDraft(id, function(next) { next.parameters[key] = value; }); },
					onBlurField: function(id, key) { var result = validateStrategyDraft(id, drafts[id]); setFieldError(id, key, result.errors[key]); },
					onToggle: function(id) {
						setDraft(id, function(next) { next.enabled = !next.enabled; });
						notify("策略 " + id + (drafts[id].enabled ? " 已暂停" : " 已设为运行中") + "（本地演示，尚未保存）");
					},
					onSave: saveOne,
					onJson: openJson
				});
			});
			var dialogNode = null;
			if (dialog !== null && dialog.kind === "json") {
				dialogNode = h(StrategyJsonDialog, { strategyId: dialog.id, draft: drafts[dialog.id], onApply: applyJson, onClose: closeDialog });
			} else if (dialog !== null && dialog.kind === "stats") {
				dialogNode = h(StrategyStatsDialog, { configs: dialog.configs, onClose: closeDialog });
			} else if (dialog !== null && dialog.kind === "review") {
				dialogNode = h(StrategyReviewDialog, { sections: dialog.sections, onClose: closeDialog });
			} else if (dialog !== null && dialog.kind === "agent") {
				dialogNode = h(StrategyAgentDialog, {
					drafts,
					saved,
					review: agentReview,
					market,
					summaries: marketSummaries,
					onApply: applyAgentSuggestions,
					onClose: closeDialog
				});
			}
			return h("section", { className: "hdy-strategy", "data-hdy-strategy": "", ref: rootRef }, h("h1", { className: "hdy-vh" }, "策略管理 · 本地演示"), h("section", { className: "hdy-rankings", "aria-label": "截图策略收益排行" }, rankings), h("div", { className: "hdy-toolbar", role: "group", "aria-label": "策略管理操作" }, h("button", { type: "button", className: "hdy-btn hdy-btn-primary", onClick: function() {
				var configs = validatedCurrent("全部保存");
				if (configs !== null) persist(configs, "全部 3 个策略配置已保存至本地");
			} }, "保存策略配置"), h("button", { type: "button", className: "hdy-btn hdy-btn-accent", onClick: function(event) { openReview(event.currentTarget); } }, "一键智能复盘优化"), h("button", { type: "button", className: "hdy-btn", onClick: exportCsv }, "导出 features.csv"), h("button", { type: "button", className: "hdy-btn", onClick: function(event) { openStats(event.currentTarget); } }, "统计特征库"), h("button", { type: "button", className: "hdy-btn hdy-btn-accent", onClick: function(event) { openDialog({ kind: "agent" }, event.currentTarget); } }, "AI 参数建议"), h("span", { className: "hdy-save-state", "data-dirty": dirtyCount > 0 ? "1" : "0" }, saveStateText)), h("div", {
				className: "hdy-market",
				"data-status": market.status,
				"data-market": "strip",
				"data-stale": market.status === "error" && market.rows.length > 0 ? "1" : "0",
				"aria-live": "polite"
			}, h("span", { className: "hdy-market-source" }, "Binance 现货"), market.rows.length === 0 ? h("span", { className: "hdy-market-empty" }, market.status === "error" ? "行情不可用：" + market.error : "行情加载中…") : market.rows.map(function(row) {
				return h("span", { key: row.symbol, className: "hdy-market-row" }, h("b", null, row.symbol), " " + (row.price >= 1000 ? row.price.toFixed(2) : row.price.toFixed(4)), h("span", { className: row.changePercent >= 0 ? "hdy-up" : "hdy-down" }, " " + (row.changePercent >= 0 ? "+" : "") + row.changePercent.toFixed(2) + "%"));
			}), market.at === null ? null : h("span", { className: "hdy-market-time" }, (market.status === "error" ? "最后更新 " : "更新 ") + new Date(market.at).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })), h("span", { className: "hdy-market-state" }, market.status === "live" ? "● 实时" : market.status === "error" ? "● 断开，重试中" : "○ 连接中"), market.status === "error" ? h("span", { className: "hdy-warn hdy-market-error" }, market.error) : null), marketSummaries.length === 0 ? null : h("div", { className: "hdy-market hdy-market-history", "data-market": "history" }, h("span", { className: "hdy-market-source" }, "近 7 天 1h"), marketSummaries.map(function(entry) {
				return h("span", { key: entry.symbol, className: "hdy-market-row" }, h("b", null, entry.symbol), " 涨跌 ", h("span", { className: entry.summary.changePercent >= 0 ? "hdy-up" : "hdy-down" }, (entry.summary.changePercent >= 0 ? "+" : "") + entry.summary.changePercent + "%"), " · 波动 " + entry.summary.volatilityPercent + "% · 高 " + entry.summary.high + " / 低 " + entry.summary.low);
			})), pageError === "" ? null : h("p", { className: "hdy-page-error", role: "alert" }, pageError), h("section", { className: "hdy-strategies", "aria-label": "策略配置" }, cards), h("footer", { className: "hdy-footer" }, h("p", null, "演示模式 · 数据来自参考截图，不连接钱包，不执行真实交易"), h("p", null, dirtyCount > 0 ? "有未保存修改；刷新后将恢复上次保存的配置。配置只存于当前浏览器。" : "配置仅保存在当前浏览器；未保存的修改在刷新后丢失。")), toast === "" ? null : h("div", { className: "hdy-toast", role: "status", "aria-live": "polite", "aria-atomic": "true" }, toast), dialogNode);
		}
		//#endregion
		var inject = ["slots"];
		/**
		 * Register the composer seat. Automatic priority places the button into the
		 * compact-control row that renders immediately before the model selector.
		 * @param ctx - the plugin context.
		 */
		function apply(ctx) {
			ctx.effect(function() {
				return ctx.slots.inject("conversation.input.right", function() {
					return ctx.slots.register({
						name: "conversation.input.right",
						id: "hdy-plugin",
						order: 5
					}, PromptPolish);
				});
			}, "prompt-polish: composer seat");
			/** 策略管理：与“自动化任务”同级、紧随其后的一行（order 15 介于 10 与 20 之间）。 */
			ctx.effect(function() {
				return ctx.slots.inject("sidebar.panellist", function() {
					return ctx.slots.register({
						name: "sidebar.panellist",
						id: "strategy-dashboard",
						order: 15,
						label: function() { return "策略管理"; }
					}, StrategyPanelIcon);
				});
			}, "strategy: sidebar entry");
			ctx.effect(function() {
				return ctx.slots.inject("main", function() {
					return ctx.slots.register({ name: "main", key: "strategy-dashboard" }, StrategyPage);
				});
			}, "strategy: page");
		}
		/** Exposed for the contract test: the new features are pure logic worth driving directly. */
		exports.__scoreDraft = scoreDraft;
		exports.__analyzeChange = analyzeChange;
		exports.__usageText = usageText;
		exports.__strategy = { validateSuggestion: validateStrategySuggestion, applySuggestions: applyStrategySuggestions, buildAgentPayload: buildStrategyAgentPayload, buildMarketSummary, parseMarketTickers, parseMarketKlines, STORAGE_KEY: STRATEGY_STORAGE_KEY, STORAGE_VERSION: STRATEGY_STORAGE_VERSION, FIELDS: STRATEGY_FIELDS, STRATEGIES: STRATEGY_LIST, RANKINGS: STRATEGY_RANKINGS, createDefaultConfigs: strategyDefaults, createDrafts: createStrategyDrafts, draftFromConfig: strategyDraftFromConfig, validateConfig: validateStrategyConfig, validateDraft: validateStrategyDraft, validateAllDrafts: validateAllStrategyDrafts, serializeState: serializeStrategyState, parseStoredState: parseStrategyState, mergeSavedConfig: mergeSavedStrategyConfig, isDraftDirty: isStrategyDraftDirty, buildFeaturesCsv: buildStrategyCsv, reviewConfigs: reviewStrategyConfigs };
		exports.PromptPolish = PromptPolish;
		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});
