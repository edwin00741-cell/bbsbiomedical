$ErrorActionPreference = "Stop"

$nextEnvPath = "next-env.d.ts"
$nextEnvBefore = if (Test-Path $nextEnvPath) { Get-Content $nextEnvPath -Raw } else { $null }

$env:NEXT_DIST_DIR = ".next-build"
try {
  & ".\node_modules\.bin\next.cmd" build
}
finally {
  if ($null -ne $nextEnvBefore) {
    Set-Content -Path $nextEnvPath -Value $nextEnvBefore -NoNewline
  }
}
