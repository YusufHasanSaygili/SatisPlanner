param(
    [Parameter(Mandatory = $true)]
    [string]$InstallerPath
)

$ErrorActionPreference = 'Stop'
$resolvedInstaller = (Resolve-Path -LiteralPath $InstallerPath).Path
if ([System.IO.Path]::GetExtension($resolvedInstaller) -ne '.exe') {
    throw "Expected an NSIS .exe installer: $resolvedInstaller"
}

$candidateInstallRoots = @(
    (Join-Path $env:LOCALAPPDATA 'Programs\SatisPlanner'),
    (Join-Path $env:LOCALAPPDATA 'SatisPlanner')
)
$appDataRoot = Join-Path $env:APPDATA 'dev.satisplanner.desktop'
$plansRoot = Join-Path $appDataRoot 'plans'
$sentinel = Join-Path $appDataRoot 'uninstall-preserves-user-data.txt'
New-Item -ItemType Directory -Force -Path $appDataRoot | Out-Null
Set-Content -LiteralPath $sentinel -Value 'SatisPlanner user data must survive uninstall.' -Encoding UTF8

$installer = Start-Process -FilePath $resolvedInstaller -ArgumentList '/S' -Wait -PassThru -WindowStyle Hidden
if ($installer.ExitCode -ne 0) { throw "Installer exited with $($installer.ExitCode)." }

$app = $candidateInstallRoots |
    Where-Object { Test-Path -LiteralPath $_ } |
    ForEach-Object { Get-ChildItem -LiteralPath $_ -Recurse -File } |
    Where-Object { $_.Name -ieq 'SatisPlanner.exe' } |
    Select-Object -First 1
if (-not $app) {
    throw "Installed SatisPlanner.exe was not found under an expected current-user location."
}
$installRoot = $app.DirectoryName

$versionOutput = & $app.FullName --version
if ($LASTEXITCODE -ne 0 -or $versionOutput -notmatch '^SatisPlanner 1\.0\.0$') {
    throw "Installed binary version smoke failed: $versionOutput"
}

$firstLaunch = Start-Process -FilePath $app.FullName -PassThru -WindowStyle Hidden
$savedPlans = @()
foreach ($attempt in 1..45) {
    Start-Sleep -Seconds 1
    if ($firstLaunch.HasExited) { throw "SatisPlanner exited during no-game fallback launch." }
    $savedPlans = @(Get-ChildItem -LiteralPath $plansRoot -Filter '*.json' -File -ErrorAction SilentlyContinue)
    if ($savedPlans.Count -ge 1) { break }
}
$firstLaunch | Stop-Process -Force

if ($savedPlans.Count -lt 1) { throw "Packaged application did not save a plan under $plansRoot." }

$secondLaunch = Start-Process -FilePath $app.FullName -PassThru -WindowStyle Hidden
Start-Sleep -Seconds 5
if ($secondLaunch.HasExited) { throw "SatisPlanner exited while reopening the saved plan." }
$secondLaunch | Stop-Process -Force

$uninstaller = Get-ChildItem -LiteralPath $installRoot -Recurse -File |
    Where-Object { $_.Name -like 'uninstall*.exe' } |
    Select-Object -First 1
if (-not $uninstaller) { throw "NSIS uninstaller was not found under $installRoot." }
$uninstall = Start-Process -FilePath $uninstaller.FullName -ArgumentList '/S' -Wait -PassThru -WindowStyle Hidden
if ($uninstall.ExitCode -ne 0) { throw "Uninstaller exited with $($uninstall.ExitCode)." }
if (-not (Test-Path -LiteralPath $sentinel)) { throw 'Uninstall removed user-owned app data.' }

[pscustomobject]@{
    installer = [System.IO.Path]::GetFileName($resolvedInstaller)
    version = $versionOutput
    noGameFallback = 'passed'
    saveReopen = 'passed'
    uninstallPreservedUserData = 'passed'
    savedPlanCount = $savedPlans.Count
} | ConvertTo-Json
