@echo off
echo ========================================
echo    PC Controller - Starting Services
echo ========================================
echo.

:: Get local IP
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4"') do (
    set IP=%%a
    goto :found
)
:found
set IP=%IP:~1%

echo Your PC's IP address: %IP%
echo.
echo Access the controller from your phone at:
echo    http://%IP%:3000
echo.
echo ========================================

:: Start backend in new window
echo Starting Python Backend...
start "PC Controller Backend" cmd /k "cd /d C:\Users\billy\conroleer\backend && python server.py"

:: Wait a bit for backend to start
timeout /t 3 /nobreak >nul

:: Start frontend in new window
echo Starting Next.js Frontend...
start "PC Controller Frontend" cmd /k "cd /d C:\Users\billy\conroleer\frontend && npm run dev -- -H 0.0.0.0"

echo.
echo Both servers are starting...
echo.
echo Backend API: http://%IP%:8000
echo Frontend UI: http://%IP%:3000
echo.
echo Open http://%IP%:3000 on your phone!
echo.
pause
