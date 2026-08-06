$InstallerPath = "$env:TEMP\pg16_installer.exe"
$PgBinDir      = "C:\Program Files\PostgreSQL\16\bin"
$PgPassword    = "trigrowth123"
$DbUser        = "trigrowth"
$DbPassword    = "trigrowth123"
$DbName        = "trigrowth_ai"
$ProjectDir    = "C:\Users\julie\.gemini\antigravity\scratch\trigrowth-ai"

Write-Host ""
Write-Host "====================================" -ForegroundColor Cyan
Write-Host "  TriGrowth AI - DB Setup" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan

# Step 1: Verify installer
if (-not (Test-Path $InstallerPath)) {
    Write-Error "Installer not found at $InstallerPath"; exit 1
}
$sizeMB = [math]::Round((Get-Item $InstallerPath).Length / 1MB, 1)
Write-Host "Installer ready: $sizeMB MB" -ForegroundColor Green

# Step 2: Silent install (requires UAC - click YES when prompted)
Write-Host ""
Write-Host "[1/4] Installing PostgreSQL 16 silently..." -ForegroundColor Yellow
Write-Host "      >>> A UAC dialog will appear - please click YES <<<" -ForegroundColor Red

$args = "--mode unattended --unattendedmodeui none --superpassword $PgPassword --servicename postgresql-x64-16 --serverport 5432 --prefix `"C:\Program Files\PostgreSQL\16`" --datadir `"C:\Program Files\PostgreSQL\16\data`""

$proc = Start-Process -FilePath $InstallerPath -ArgumentList $args -Wait -PassThru -Verb RunAs
Write-Host "Install exit code: $($proc.ExitCode)"

if ($proc.ExitCode -ne 0) {
    Write-Host "Installation may have failed. Checking if psql exists anyway..." -ForegroundColor Yellow
}

# Step 3: Wait for service + add to PATH
Start-Sleep -Seconds 8
$env:PATH = "$PgBinDir;$env:PATH"
$env:PGPASSWORD = $PgPassword

# Check psql is reachable
if (-not (Test-Path "$PgBinDir\psql.exe")) {
    Write-Error "psql.exe not found at $PgBinDir - installation may have failed"; exit 1
}
Write-Host "[OK] psql.exe found" -ForegroundColor Green

# Start service if not running
$svc = Get-Service "postgresql*" -ErrorAction SilentlyContinue | Select-Object -First 1
if ($svc) {
    if ($svc.Status -ne "Running") {
        Start-Service $svc.Name -ErrorAction SilentlyContinue
        Start-Sleep -Seconds 4
    }
    Write-Host "[OK] Service: $($svc.Name) = $($svc.Status)" -ForegroundColor Green
}

# Step 4: Create DB user and database
Write-Host ""
Write-Host "[2/4] Creating database and user..." -ForegroundColor Yellow

& "$PgBinDir\psql.exe" -U postgres -h localhost -p 5432 -c "CREATE USER $DbUser WITH PASSWORD '$DbPassword';" 2>&1
& "$PgBinDir\psql.exe" -U postgres -h localhost -p 5432 -c "CREATE DATABASE $DbName OWNER $DbUser ENCODING 'UTF8';" 2>&1
& "$PgBinDir\psql.exe" -U postgres -h localhost -p 5432 -c "GRANT ALL PRIVILEGES ON DATABASE $DbName TO $DbUser;" 2>&1

# Step 5: Load schema
Write-Host ""
Write-Host "[3/4] Loading schema.sql..." -ForegroundColor Yellow
$env:PGPASSWORD = $DbPassword
& "$PgBinDir\psql.exe" -U $DbUser -h localhost -p 5432 -d $DbName -f "$ProjectDir\database\schema.sql" 2>&1
Write-Host "[OK] Schema loaded" -ForegroundColor Green

# Step 6: Load seed data
Write-Host ""
Write-Host "[4/4] Loading seed.sql..." -ForegroundColor Yellow
& "$PgBinDir\psql.exe" -U $DbUser -h localhost -p 5432 -d $DbName -f "$ProjectDir\database\seed.sql" 2>&1
Write-Host "[OK] Seed data loaded" -ForegroundColor Green

# Step 7: Verify
Write-Host ""
Write-Host "====================================" -ForegroundColor Green
Write-Host "  VERIFICATION RESULTS" -ForegroundColor Green
Write-Host "====================================" -ForegroundColor Green

Write-Host "`nUsers by role:"
& "$PgBinDir\psql.exe" -U $DbUser -h localhost -p 5432 -d $DbName -c "SELECT role, COUNT(*) FROM users GROUP BY role ORDER BY role;"

Write-Host "`nProjects:"
& "$PgBinDir\psql.exe" -U $DbUser -h localhost -p 5432 -d $DbName -c "SELECT status, COUNT(*) FROM projects GROUP BY status;"

Write-Host "`nRecommendations:"
& "$PgBinDir\psql.exe" -U $DbUser -h localhost -p 5432 -d $DbName -c "SELECT priority, status, LEFT(problem,55) AS problem FROM recommendations ORDER BY priority;"

Write-Host ""
Write-Host "====================================" -ForegroundColor Green
Write-Host "  DATABASE READY!" -ForegroundColor Green
Write-Host "  Host:     localhost:5432" -ForegroundColor White
Write-Host "  Database: $DbName" -ForegroundColor White
Write-Host "  User:     $DbUser / $DbPassword" -ForegroundColor White
Write-Host "====================================" -ForegroundColor Green
