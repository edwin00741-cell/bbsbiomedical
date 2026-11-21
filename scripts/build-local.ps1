$ErrorActionPreference = "Stop"

$nextEnvPath = "next-env.d.ts"
$nextEnvBefore = if (Test-Path $nextEnvPath) { Get-Content $nextEnvPath -Raw } else { $null }

$env:NEXT_DIST_DIR = ".next-build-local"
try {
  # Webpack avoids Turbopack junction conflicts in OneDrive on Windows.
  & ".\node_modules\.bin\next.cmd" build --webpack
  $buildExitCode = $LASTEXITCODE
}
finally {
  if ($null -ne $nextEnvBefore) {
    Set-Content -Path $nextEnvPath -Value $nextEnvBefore -NoNewline
  }
}
exit $buildExitCode
