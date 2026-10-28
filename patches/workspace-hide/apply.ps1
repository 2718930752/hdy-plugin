# Re-apply the "hide workspace" patch to the installed DSH workspace UI.
[CmdletBinding()]
param(
  [string]$DshApp
)
$ErrorActionPreference = 'Stop'
$here = $PSScriptRoot

if (-not $DshApp) {
  $candidates = @(
    'D:\Programs\DSH Desktop Beta\resources\app',
    (Join-Path $env:LOCALAPPDATA 'Programs\DeepSeek Harness\resources\app'),
    (Join-Path $env:ProgramFiles 'DeepSeek Harness\resources\app')
  )
  $DshApp = $candidates | Where-Object { Test-Path $_ } | Select-Object -First 1
}
if (-not $DshApp) { throw 'DSH app directory not found. Pass -DshApp <path to resources/app>.' }

$target = Join-Path $DshApp 'node_modules/@deepseek-ai/dsh-client-ui-workspace/lib/client.js'
if (-not (Test-Path $target)) { throw "Workspace UI bundle not found: $target" }

$source = Join-Path $here 'client.js'
& node --check $source
if ($LASTEXITCODE -ne 0) { throw 'The archived patched bundle no longer parses; re-derive the patch from README.zh.md.' }

$backup = Join-Path $here ('client.js.bak-' + (Get-Date -Format 'yyyyMMdd-HHmmss'))
Copy-Item -LiteralPath $target -Destination $backup
Copy-Item -LiteralPath $source -Destination $target -Force
& node --check $target
if ($LASTEXITCODE -ne 0) {
  Copy-Item -LiteralPath $backup -Destination $target -Force
  throw 'Installed copy failed the syntax check; the previous file was restored.'
}
Write-Host "Patched: $target"
Write-Host "Backup:  $backup"
Write-Host 'Reload the interface (titlebar restart menu -> 重新加载界面) to see the new workspace menu entries.'
