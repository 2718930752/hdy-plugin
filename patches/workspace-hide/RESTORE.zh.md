# 还原

```powershell
pwsh -File ./revert.ps1
```

会用本目录的 `client.js.orig`（未打补丁的原版，已用反向替换重建并校验：0 处残留、`node --check` 通过）覆盖安装目录里的同名文件，并先备份当前已打补丁的版本。

也可以只把 `client.js.orig` 手工复制回：

`<DSH>/resources/app/node_modules/@deepseek-ai/dsh-client-ui-workspace/lib/client.js`

然后重新加载界面。隐藏偏好存在 localStorage 的 `dsh.workspaces.hidden.v1`，还原界面后不再生效，但数据仍在，重新打补丁即恢复。
