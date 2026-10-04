@echo off
REM ============================================================
REM  ProLance - One-Click Demo Startup Script
REM  Run this file to start all 3 services for the demo
REM ============================================================

echo.
echo  ====================================================
echo   Starting ProLance Demo Environment
echo  ====================================================
echo.

REM ── Brevo (Sendinblue) SMTP — real email delivery ────────────
set SMTP_HOST=smtp-relay.brevo.com
set SMTP_PORT=587
set SMTP_USERNAME=bb81c2001@smtp-brevo.com
set SMTP_PASSWORD=xsmtpsib-85133dbf4ab968dfc3ab343348ea91fc1dd2e3de0eb288fdad45685583869447-YvTdt77NtIKjGtxl
set SMTP_FROM=noreply@prolance.ai
set BREVO_API_KEY=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
set BREVO_SENDER_EMAIL=bb81c2001@smtp-brevo.com

REM ── Google OAuth credentials ──────────────────────────────
set GOOGLE_CLIENT_ID=636228352892-a1cc2er9mn712urd15ejjor110jto138.apps.googleusercontent.com
set GOOGLE_CLIENT_SECRET=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

echo [1/3] Starting AI Service (Python)...
start "ProLance AI Service" cmd /k "cd /d %~dp0ai-service && .venv\Scripts\python.exe -m uvicorn main:app --port 8001"

echo [2/3] Starting Backend (Spring Boot)...
start "ProLance Backend" cmd /k "cd /d %~dp0backend && set BREVO_API_KEY=%BREVO_API_KEY% && set BREVO_SENDER_EMAIL=%BREVO_SENDER_EMAIL% && set GOOGLE_CLIENT_ID=%GOOGLE_CLIENT_ID% && set GOOGLE_CLIENT_SECRET=%GOOGLE_CLIENT_SECRET% && mvn spring-boot:run -q"

echo [3/3] Starting Frontend (React)...
start "ProLance Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo  ====================================================
echo   All services started! 
echo.
echo   Frontend:   http://localhost:5173
echo   Backend:    http://localhost:8080/api
echo   AI Service: http://localhost:8001
echo.
echo   Demo Accounts:
echo   ─────────────────────────────────────────────
echo   Owner:      admin@prolance.ai     / admin123
echo   Client:     demo.client@prolance.ai  / Demo@2026
echo   Freelancer: demo.freelancer@prolance.ai / Demo@2026
echo  ====================================================
echo.
pause
