@echo off
echo ========================================
echo    PC Controller - Remote Access Mode
echo ========================================
echo.

:: Check if ngrok is configured
ngrok config check >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: ngrok is not configured!
    echo.
    echo Please run: ngrok config add-authtoken YOUR_TOKEN
    echo Get your token at: https://dashboard.ngrok.com/get-started/your-authtoken
    echo.
    pause
    exit /b 1
)

:: Get local IP
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4"') do (
    set IP=%%a
    goto :found
)
:found
set IP=%IP:~1%

echo Local IP: %IP%
echo.

:: Start backend
echo Starting Python Backend...
start "PC Controller Backend" cmd /k "cd /d C:\Users\billy\conroleer\backend && python server.py"
timeout /t 3 /nobreak >nul

:: Start frontend
echo Starting Next.js Frontend...
start "PC Controller Frontend" cmd /k "cd /d C:\Users\billy\conroleer\frontend && npm run dev -- -H 0.0.0.0"
timeout /t 5 /nobreak >nul

:: Start ngrok tunnels
echo Starting ngrok tunnels...
echo.
echo ========================================
echo    REMOTE ACCESS URLs
echo ========================================
echo.
echo Once ngrok starts, look for the "Forwarding" URLs
echo Share the https://xxxxx.ngrok.io URL with yourself
echo.
echo Backend tunnel starting on port 8000...
start "Ngrok Backend" cmd /k "ngrok http 8000"

timeout /t 3 /nobreak >nul

echo Frontend tunnel starting on port 3000...  
start "Ngrok Frontend" cmd /k "ngrok http 3000"

echo.
echo ========================================
echo Check the ngrok windows for your public URLs!
echo ========================================
echo.
pause
