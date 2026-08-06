@echo off
:: ================================================================
::  TriGrowth AI – PostgreSQL Setup Script for Windows
::  Run as Administrator if needed
:: ================================================================

echo.
echo  ████████╗██████╗ ██╗ ██████╗ ██████╗  ██████╗ ██╗    ██╗████████╗██╗  ██╗
echo  ╚══██╔══╝██╔══██╗██║██╔════╝ ██╔══██╗██╔═══██╗██║    ██║╚══██╔══╝██║  ██║
echo     ██║   ██████╔╝██║██║  ███╗██████╔╝██║   ██║██║ █╗ ██║   ██║   ███████║
echo     ██║   ██╔══██╗██║██║   ██║██╔══██╗██║   ██║██║███╗██║   ██║   ██╔══██║
echo     ██║   ██║  ██║██║╚██████╔╝██║  ██║╚██████╔╝╚███╔███╔╝   ██║   ██║  ██║
echo     ╚═╝   ╚═╝  ╚═╝╚═╝ ╚═════╝ ╚═╝  ╚═╝ ╚═════╝  ╚══╝╚══╝   ╚═╝   ╚═╝  ╚═╝
echo.
echo  [AI] Database Setup Script
echo  ================================================

:: Check if psql is available
where psql >nul 2>&1
if %errorlevel%==0 (
    echo  [OK] PostgreSQL psql found
    goto :run_psql
) else (
    echo  [INFO] psql not found – checking for Docker...
)

:: Check Docker
where docker >nul 2>&1
if %errorlevel%==0 (
    echo  [OK] Docker found. Starting PostgreSQL via Docker Compose...
    docker compose up -d postgres
    echo  [WAIT] Waiting for PostgreSQL to be ready...
    timeout /t 10 /nobreak >nul
    echo  [OK] PostgreSQL running on localhost:5432
    echo.
    echo  Connection details:
    echo    Host:     localhost
    echo    Port:     5432
    echo    Database: trigrowth_ai
    echo    User:     trigrowth
    echo    Password: trigrowth123
    echo.
    echo  Optional: Open pgAdmin at http://localhost:5050
    echo    Email: admin@tea.com  /  Password: admin123
    docker compose up -d pgadmin
    goto :done
) else (
    goto :manual_install
)

:run_psql
echo.
echo  Creating database and user...
psql -U postgres -c "CREATE USER trigrowth WITH PASSWORD 'trigrowth123';" 2>nul
psql -U postgres -c "CREATE DATABASE trigrowth_ai OWNER trigrowth;" 2>nul
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE trigrowth_ai TO trigrowth;" 2>nul
echo  Running schema...
psql -U trigrowth -d trigrowth_ai -f database\schema.sql
echo  Loading seed data...
psql -U trigrowth -d trigrowth_ai -f database\seed.sql
echo  [OK] Database ready!
goto :done

:manual_install
echo.
echo  ================================================================
echo   SETUP REQUIRED – Choose one of these options:
echo  ================================================================
echo.
echo   OPTION 1: Install Docker Desktop (Recommended - Easiest)
echo   ---------------------------------------------------------
echo   1. Download: https://www.docker.com/products/docker-desktop
echo   2. Install and restart your computer
echo   3. Run this script again
echo.
echo   OPTION 2: Install PostgreSQL directly
echo   ---------------------------------------------------------
echo   1. Download: https://www.postgresql.org/download/windows/
echo   2. Install with default settings (remember the password!)
echo   3. Run this script again
echo.
echo   OPTION 3: Manual setup (if PostgreSQL already installed elsewhere)
echo   ---------------------------------------------------------
echo   Run these commands in psql:
echo     CREATE USER trigrowth WITH PASSWORD 'trigrowth123';
echo     CREATE DATABASE trigrowth_ai OWNER trigrowth;
echo     \connect trigrowth_ai
echo     \i database/schema.sql
echo     \i database/seed.sql
echo.
:done
pause
