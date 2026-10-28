# Develop hdy-plugin without restarting the main DSH window.
[CmdletBinding()]
param(
  [ValidateSet('menu','start','stop','restart','test','status')]
  [string]$Action = 'menu',
  [int]$Port = 43121,
  [string]$Profile = 'hdy-dev'
)
$ErrorActionPreference = 'Stop'
$root = $PSScriptRoot
$statePath = Join-Path $root '.dev/instance.json'
$logPath = Join-Path $root '.dev/instance.log'
$errPath = Join-Path $root '.dev/instance.err.log'
New-Item -ItemType Directory -Path (Join-Path $root '.dev') -Force | Out-Null

function Get-State {
  if (-not (Test-Path $statePath)) { return $null }
  try { return Get-Content -Raw -LiteralPath $statePath | ConvertFrom-Json } catch { return $null }
}
function Test-Alive([int]$instancePort) {
  return [bool](Get-NetTCPConnection -LocalPort $instancePort -State Listen -ErrorAction SilentlyContinue)
}
function Stop-Instance {
  $state = Get-State
  if ($null -eq $state) { Write-Host '开发实例未在运行。'; return }
  if (Test-Alive ($state.port)) { & taskkill /PID $state.pid /T /F | Out-Null }
  Remove-Item -LiteralPath $statePath -Force -ErrorAction SilentlyContinue
  Write-Host '开发实例已停止。'
}
function Start-Instance {
  $state = Get-State
  if ($null -ne $state -and (Test-Alive ($state.port))) {
    Write-Host ("开发实例已在运行: " + $state.url)
    return
  }
  if (Test-Alive $Port) { throw "端口 $Port 已被其他进程占用。" }
  $profileDir = Join-Path $env:DSH_HOME ('profiles/' + $Profile)
  if (-not (Test-Path (Join-Path $profileDir 'package.json'))) {
    Write-Host "首次运行：创建开发 profile $Profile（只安装本插件）..."
    & dsh plugin --profile $Profile add ("link:" + $root.Replace('\','/')) --config.ignore-scripts=true
    if ($LASTEXITCODE -ne 0) { throw '开发 profile 创建失败。' }
    Write-Host '已创建。若该 profile 没有模型配置，请在它的 cordis.patch.yml 里补上 provider，或从主 profile 复制。'
  }
  Remove-Item -LiteralPath $logPath, $errPath -Force -ErrorAction SilentlyContinue
  $proc = Start-Process -FilePath 'dsh.cmd' -ArgumentList @('--profile', $Profile, '--port', "$Port", '--no-open') -RedirectStandardOutput $logPath -RedirectStandardError $errPath -WindowStyle Hidden -PassThru
  $url = $null
  for ($i = 0; $i -lt 120; $i++) {
    Start-Sleep -Milliseconds 500
    if (Test-Path $logPath) {
      $match = Select-String -Path $logPath -Pattern 'dsh web: (http\S+)' -ErrorAction SilentlyContinue | Select-Object -First 1
      if ($match) { $url = $match.Matches[0].Groups[1].Value; break }
    }
    if ($proc.HasExited) { break }
  }
  if (-not $url) {
    $tail = if (Test-Path $errPath) { Get-Content $errPath -Tail 15 } else { @() }
    throw ("开发实例启动失败。日志: $errPath" + [Environment]::NewLine + ($tail -join [Environment]::NewLine))
  }
  @{ pid = $proc.Id; port = $Port; url = $url; startedAt = (Get-Date).ToString('o') } | ConvertTo-Json | Set-Content -LiteralPath $statePath -Encoding UTF8
  Write-Host ("开发实例已启动: " + $url)
  Write-Host '浏览器打开该地址即可调试；改 lib/client.js 保存后自动热更新，改宿主代码后回到本菜单重启开发实例。'
}
function Invoke-Tests {
  foreach ($test in @('mustache.test.mjs','smoke.mjs','contract.test.mjs','host.test.mjs')) {
    $output = @(& node (Join-Path $root $test) 2>&1)
    $code = $LASTEXITCODE
    Write-Host ("{0,-20} {1,4} 项  {2}" -f $test, @($output | Where-Object { $_ -match '^PASS ' }).Count, ($output | Select-Object -Last 1))
    if ($code -ne 0) { $output | Write-Host; throw "$test 失败" }
  }
  Write-Host '全部通过。'
}
function Show-Status {
  $state = Get-State
  if ($null -ne $state -and (Test-Alive ($state.port))) {
    Write-Host ("运行中: " + $state.url)
  } else { Write-Host '开发实例未运行。' }
  Write-Host '客户端改动（lib/client.js）保存后自动热更新，不需要重启任何实例。'
}
function Show-Menu {
  while ($true) {
    Write-Host ''
    Write-Host '1. 启动 / 打开开发实例（独立进程，不碰主窗口）'
    Write-Host '2. 停止开发实例'
    Write-Host '3. 重启开发实例（宿主代码改完后用）'
    Write-Host '4. 跑全部测试（534 项）'
    Write-Host '5. 查看状态'
    Write-Host '6. 退出'
    $choice = Read-Host '选择 [1]'
    if (-not $choice) { $choice = '1' }
    switch ($choice) {
      '1' { Start-Instance }
      '2' { Stop-Instance }
      '3' { Stop-Instance; Start-Instance }
      '4' { Invoke-Tests }
      '5' { Show-Status }
      '6' { return }
      default { Write-Host '请输入 1-6。' }
    }
  }
}
switch ($Action) {
  'start' { Start-Instance }
  'stop' { Stop-Instance }
  'restart' { Stop-Instance; Start-Instance }
  'test' { Invoke-Tests }
  'status' { Show-Status }
  default { Show-Menu }
}
