@echo off
title ZhenZhen Smart Home - Dev Starter
echo ========================================
echo   ZhenZhen Smart Home - Dev Starter
echo   Backend :8000 / Frontend :5173 / Admin :5174
echo ========================================
echo.

rem ---- Backend (FastAPI) ----
start "zhen-backend" cmd /k "cd /d %~dp0server && .venv\Scripts\python -m uvicorn app.main:app --host 127.0.0.1 --port 8000"

rem ---- Frontend (Vite) ----
start "zhen-frontend" cmd /k "cd /d %~dp0front && npm run dev"

rem ---- Admin (Vite) ----
start "zhen-admin" cmd /k "cd /d %~dp0admin && npm run dev"

echo.
echo 3 windows opened. URLs:
echo   Backend  : http://127.0.0.1:8000
echo   Frontend : http://localhost:5173
echo   Admin    : http://localhost:5174
echo.
echo Close the windows to stop the services.
pause
