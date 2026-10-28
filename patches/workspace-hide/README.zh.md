# 工作区隐藏补丁

给 DSH 侧边栏的工作区行菜单加上「隐藏工作区」，并在分组标题栏出现「已隐藏 N」开关，点开即可看到、恢复隐藏的工作区。

DSH 的工作区行菜单是写死的（只有重命名/删除），也没有给插件留插槽，所以这一项改在应用自带的
`@deepseek-ai/dsh-client-ui-workspace/lib/client.js` 上，而不是 hdy-plugin 里。

## 改了哪 6 处

1. 新增存储帮助函数 `readHiddenWorkspaceIds` / `writeHiddenWorkspaceIds`，键 `dsh.workspaces.hidden.v1`（浏览器 localStorage）。
2. `deriveGroups(...)` 增加第 6 个参数 `hiddenWorkspaceIds`：被隐藏的工作区仍计入会话归属（会话不会漏进「未分组」），只是跳过该分组。
3. `SessionTree` 接收 `hiddenWorkspaceIds` / `onToggleWorkspaceHidden`，并把它传进 `deriveGroups`（依赖数组同步）。
4. 工作区行菜单 `workspaceMenuItems` 增加 `hide` 项，`onSelect` 分派到 `actions.hide()`；`actions` 对象里增加 `hide`。
5. `WorkspaceBrowser` 增加 `hiddenWorkspaceIds` / `showHiddenWorkspaces` 状态与切换函数；平铺视图按隐藏工作区过滤 `sessionIds`；标题栏渲染「已隐藏 N / 隐藏中 N · 点击显示」按钮。
6. 中英文案：`hide.workspace`、`hidden.show`、`hidden.hide`。

## 安装 / 重装

更新 DSH 后应用目录里的这个文件会被覆盖，重新执行（无参数）：

```powershell
pwsh -File ./apply.ps1
```

脚本会备份原文件、复制本目录的 `client.js`、做 `node --check`，失败会自动回滚。

> `client.js` 是**按 2.0.18-beta.1 打好的成品**。DSH 升级后如果直接覆盖导致界面异常，请还原备份，
> 再按上面 6 处改动重新打一遍（锚点字符串都在文件里可搜到：`workspaceMenuItems`、`deriveGroups`、
> `headerActions`、`rename.workspace.title`）。

## 使用

- 悬停工作区行 → `...` 菜单 → **隐藏工作区**。
- 任意工作区被隐藏后，分组标题栏右侧出现 **已隐藏 N**；点一下切换显示/隐藏。
- 偏好存在本机 localStorage，换窗口/重启都保留；不会改动画库里的工作区与会话。
