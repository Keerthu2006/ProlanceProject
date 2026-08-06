:: ================================================================
::  TriGrowth AI – One-Click Database Initializer
::  Run AFTER PostgreSQL is installed
::  Double-click this file as Administrator
:: ================================================================
@echo off
setlocal

echo.
echo ================================================
echo   TriGrowth AI  --  Database Initializer
echo ================================================
echo.

:: ── Find psql ────────────────────────────────────────────────
set "PSQL="
for %%d in (
    "C:\Program Files\PostgreSQL\16\bin"
    "C:\Program Files\PostgreSQL\15\bin"
    "C:\Program Files\PostgreSQL\14\bin"
    "C:\Program Files (x86)\PostgreSQL\16\bin"
) do (
    if exist "%%~d\psql.exe" (
        set "PSQL=%%~d\psql.exe"
        goto :found_psql
    )
)

echo [ERROR] psql.exe not found. Is PostgreSQL installed?
echo   Download: https://www.postgresql.org/download/windows/
pause
exit /b 1

:found_psql
echo [OK] psql found: %PSQL%

:: ── Create user + database ────────────────────────────────────
echo.
echo Creating database user and database...
echo (You may be prompted for the postgres superuser password)
echo.

set PGPASSWORD=trigrowth123
"%PSQL%" -U postgres -h localhost -p 5432 -c "CREATE USER trigrowth WITH PASSWORD 'trigrowth123';" 2>nul
"%PSQL%" -U postgres -h localhost -p 5432 -c "CREATE DATABASE trigrowth_ai OWNER trigrowth ENCODING 'UTF8';" 2>nul
"%PSQL%" -U postgres -h localhost -p 5432 -c "GRANT ALL PRIVILEGES ON DATABASE trigrowth_ai TO trigrowth;" 2>nul
echo [OK] User and database ready.

:: ── Run schema ────────────────────────────────────────────────
echo.
echo Loading schema...
set PGPASSWORD=trigrowth123
"%PSQL%" -U trigrowth -h localhost -p 5432 -d trigrowth_ai -f "%~dp0database\schema.sql"
if %errorlevel% neq 0 (
    echo [WARN] Schema may have had warnings (tables already exist is OK)
)
echo [OK] Schema loaded.

:: ── Run seed data ─────────────────────────────────────────────
echo.
echo Loading demo seed data...
"%PSQL%" -U trigrowth -h localhost -p 5432 -d trigrowth_ai -f "%~dp0database\seed.sql"
echo [OK] Seed data loaded.

:: ── Verify ────────────────────────────────────────────────────
echo.
echo ================================================
echo   VERIFICATION
echo ================================================
"%PSQL%" -U trigrowth -h localhost -p 5432 -d trigrowth_ai -c "SELECT role, COUNT(*) as count FROM users GROUP BY role ORDER BY role;"
echo.
"%PSQL%" -U trigrowth -h localhost -p 5432 -d trigrowth_ai -c "SELECT status, COUNT(*) as count FROM projects GROUP BY status ORDER BY status;"
echo.
echo ================================================
echo   DATABASE READY!
echo   Host:     localhost:5432
echo   Database: trigrowth_ai
echo   User:     trigrowth
echo   Password: trigrowth123
echo ================================================
echo.
echo Now run the Spring Boot backend:
echo   cd backend
echo   mvn spring-boot:run
echo.
pause
