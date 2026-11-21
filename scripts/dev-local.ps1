$ErrorActionPreference = "Stop"
# A separate cache avoids old Turbopack junctions under OneDrive.
$env:NEXT_DIST_DIR = ".next-local"
& ".\node_modules\.bin\next.cmd" dev --webpack @args
exit $LASTEXITCODE
