# Restore the unpatched workspace UI bundle (hide-workspace feature removed).
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

$backup = Join-Path $here ('client.js.patched-' + (Get-Date -Format 'yyyyMMdd-HHmmss'))
Copy-Item -LiteralPath $target -Destination $backup
Copy-Item -LiteralPath (Join-Path $here 'client.js.orig') -Destination $target -Force
& node --check $target
if ($LASTEXITCODE -ne 0) {
  Copy-Item -LiteralPath $backup -Destination $target -Force
  throw 'Restored file failed the syntax check; the patched file was put back.'
}
Write-Host "Restored: $target"
Write-Host "Backup of the patched file: $backup"
Write-Host 'Reload the interface (titlebar restart menu -> 重新加载界面).'
