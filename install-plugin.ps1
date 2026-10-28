# Install the local hdy-plugin fork into the active DSH profile.
[CmdletBinding()]
param(
  [Alias('ProfileName')][string]$TargetProfile = $env:DSH_PROFILE,
  [string]$DshHome = $env:DSH_HOME
)
$ErrorActionPreference = 'Stop'
if (-not $DshHome) {
  $beta = Join-Path $env:USERPROFILE '.dsh-beta'
  $DshHome = if (Test-Path $beta) { $beta } else { Join-Path $env:USERPROFILE '.dsh' }
}
if (-not $TargetProfile) {
  $profiles = @(Get-ChildItem (Join-Path $DshHome 'profiles') -Directory | Where-Object { Test-Path (Join-Path $_.FullName 'package.json') })
  if ($profiles.Count -eq 0) { throw "No existing profiles under $DshHome" }
  for ($i = 0; $i -lt $profiles.Count; $i++) { Write-Host ("{0}. {1}" -f ($i + 1), $profiles[$i].Name) }
  $selection = Read-Host 'Select profile [1]'
  if (-not $selection) { $selection = '1' }
  $number = 0
  if (-not [int]::TryParse($selection, [ref]$number) -or $number -lt 1 -or $number -gt $profiles.Count) { throw 'Invalid profile selection' }
  $TargetProfile = $profiles[$number - 1].Name
}
$profileDir = Join-Path $DshHome ('profiles/' + $TargetProfile)
$manifestPath = Join-Path $profileDir 'package.json'
if (-not (Test-Path $manifestPath)) { throw "Existing DSH profile not found: $profileDir" }
$patchPath = Join-Path $profileDir 'cordis.patch.yml'
if ((Test-Path $patchPath) -and (Select-String -LiteralPath $patchPath -Pattern '@benrong/dsh-prompt-polish|id:\s*prompt-polish' -Quiet)) {
  throw "Legacy hand-written prompt-polish patch found in $patchPath. Migrate it before installing, to avoid duplicate routes. No files changed."
}
Write-Host "Target profile: $profileDir"
Get-Command node,dsh -ErrorAction Stop | Out-Null
# Verify the fork before changing any installed files.
foreach ($file in Get-ChildItem (Join-Path $PSScriptRoot 'lib/*.js')) {
  & node --check $file.FullName
  if ($LASTEXITCODE -ne 0) { throw "Syntax check failed: $file" }
}
foreach ($test in @('mustache.test.mjs','smoke.mjs','contract.test.mjs','host.test.mjs')) {
  $output = @(& node (Join-Path $PSScriptRoot $test) 2>&1)
  $code = $LASTEXITCODE
  Write-Host ("{0}: {1} checks; {2}" -f $test,@($output | Where-Object { $_ -match '^PASS ' }).Count,($output | Select-Object -Last 1))
  if ($code -ne 0) { $output | Write-Host; throw "Test failed: $test" }
}
$backup = Join-Path $profileDir ('plugin-backups/hdy-plugin-' + (Get-Date -Format 'yyyyMMdd-HHmmss-fff'))
New-Item -ItemType Directory -Path $backup -Force | Out-Null
foreach ($file in @('package.json','pnpm-lock.yaml','pnpm-workspace.yaml','cordis.patch.yml')) {
  $path = Join-Path $profileDir $file
  if (Test-Path $path) { Copy-Item -LiteralPath $path -Destination $backup }
}
$oldPackage = Join-Path $profileDir 'node_modules/@benrong/dsh-prompt-polish'
if (Test-Path $oldPackage) { Copy-Item -LiteralPath $oldPackage -Destination (Join-Path $backup 'original-plugin') -Recurse }
Write-Host "Backup: $backup"
# Use DSH's package manager so the dependency, lockfile and bundle list agree.
$previousHome = $env:DSH_HOME
try {
  $env:DSH_HOME = $DshHome
  $source = $PSScriptRoot.Replace('\','/')
  & dsh plugin --profile $TargetProfile add ("link:" + $source) --config.ignore-scripts=true
  if ($LASTEXITCODE -ne 0) { throw 'DSH could not install the local fork. See package-manager diagnostics; backup retained.' }
  $manifest = Get-Content -Raw -LiteralPath $manifestPath | ConvertFrom-Json
  if ($manifest.dependencies.PSObject.Properties.Name -contains '@benrong/dsh-prompt-polish') {
    & dsh plugin --profile $TargetProfile remove '@benrong/dsh-prompt-polish' --config.ignore-scripts=true
    if ($LASTEXITCODE -ne 0) { throw 'Fork installed, but removing the original failed. Do not restart until the bundle list is checked.' }
  }
} finally { $env:DSH_HOME = $previousHome }
$installed = Get-Content -Raw -LiteralPath $manifestPath | ConvertFrom-Json
if ($installed.dependencies.PSObject.Properties.Name -contains '@benrong/dsh-prompt-polish' -or $installed.dsh.profile.bundles -contains '@benrong/dsh-prompt-polish') { throw 'Original plugin is still selected; check backup before restarting.' }
if ($installed.dsh.profile.bundles -notcontains 'hdy-plugin') { throw 'hdy-plugin bundle is not selected.' }
Write-Host 'Installed hdy-plugin from this checkout. Fully restart DSH to load the new host/client identity.'
Write-Host 'Model selection and history keys are unchanged. Do not move this checkout while linked.'
