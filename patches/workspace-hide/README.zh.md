# 工作区隐藏补丁

给 DSH 侧边栏加上工作区隐藏：

- 工作区行悬停 → `...` 菜单多一项 **隐藏工作区**（原来只有重命名、删除）。
- **「工作区」标题上方多一行**：常驻显示 `无隐藏工作区` / `已隐藏 N 个工作区`，右侧是 **显示 / 收起** 按钮，用来查看和恢复隐藏项。
- 隐藏状态存本机 localStorage（`dsh.workspaces.hidden.v1`），不删任何数据；被隐藏工作区的会话不会漏进「未分组」，平铺视图同样过滤。

DSH 的工作区行菜单与 section header 都是写死的，也没有给插件留插槽，所以这些改动直接落在应用自带的
`@deepseek-ai/dsh-client-ui-workspace/lib/client.js` 上，而不是 hdy-plugin 里。

## 改了哪几处

1. 新增存储帮助函数 `readHiddenWorkspaceIds` / `writeHiddenWorkspaceIds`（localStorage 键 `dsh.workspaces.hidden.v1`）。
2. `deriveGroups(...)` 增加第 6 个参数 `hiddenWorkspaceIds`：被隐藏的工作区仍计入会话归属（不落进「未分组」），只跳过该分组。
3. `SessionTree` 接收并透传 `hiddenWorkspaceIds` / `onToggleWorkspaceHidden`（含 useMemo 依赖）。
4. 工作区行菜单 `workspaceMenuItems` 增加 `hide` 项，`onSelect` 分派到 `actions.hide()`；`actions` 增加 `hide`。
5. `WorkspaceBrowser` 增加 `hiddenWorkspaceIds` / `showHiddenWorkspaces` 状态与切换函数。
6. **新增一行工具栏**：插在 `className: WorkspaceBrowser_module_css_default.sectionHeader` 之前，`className: "hdy-workspace-toolbar"`，仅在宽侧边栏（`wide`）渲染。
7. 平铺视图按隐藏工作区过滤 `sessionIds`。
8. 中英文案：`hide.workspace`、`hidden.none`、`hidden.summary`、`hidden.showAll`、`hidden.hideAll`。

## 安装 / 重装

更新 DSH 后应用目录里的这个文件会被覆盖，重新执行（无参数）：

```powershell
pwsh -File ./apply.ps1
```

会备份现有文件、复制本目录的 `client.js`、做 `node --check`，失败自动回滚。

## 还原

```powershell
pwsh -File ./revert.ps1
```

用本目录的 `client.js.orig`（未打补丁的原版，2.0.18-beta.1）覆盖回去；`revert.mjs` 会先确认目标确实是打过补丁的版本，再备份当前文件。详见 [RESTORE.zh.md](./RESTORE.zh.md)。

## 升级后怎么办

`client.js` / `client.js.orig` 都对应 **2.0.18-beta.1**。DSH 大版本更新后不要直接套用，先还原或备份，
再按上面 8 处锚点（`workspaceMenuItems`、`deriveGroups`、`sectionHeader`、`rename.workspace.title`）对**新版本**重新打一遍。
