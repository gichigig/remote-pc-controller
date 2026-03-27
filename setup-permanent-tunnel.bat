@echo off
echo ========================================
echo    PC Controller - Permanent Tunnel Setup
echo ========================================
echo.

if "%~1"=="" (
    echo ERROR: Please provide your Cloudflare tunnel token!
    echo.
    echo Usage: setup-permanent-tunnel.bat YOUR_TUNNEL_TOKEN
    echo.
    echo Get your token from:
    echo   1. Go to https://one.dash.cloudflare.com/
    echo   2. Networks - Tunnels - Create a tunnel
    echo   3. Name it "pc-controller"
    echo   4. Copy the token from the install command
    echo.
    pause
    exit /b 1
)

set TOKEN=%~1

echo Installing Cloudflare Tunnel as Windows Service...
echo.

:: Refresh PATH
for /f "tokens=*" %%a in ('powershell -Command "[System.Environment]::GetEnvironmentVariable('Path','Machine') + ';' + [System.Environment]::GetEnvironmentVariable('Path','User')"') do set PATH=%%a

:: Install the tunnel service
cloudflared service install %TOKEN%

echo.
echo ========================================
echo    Tunnel installed as Windows service!
echo ========================================
echo.
echo The tunnel will now start automatically with Windows.
echo.
echo Next steps:
echo   1. Go back to the Cloudflare dashboard
echo   2. Configure the tunnel route:
echo      - Public hostname: pc-controller.YOUR-DOMAIN.com (or use a free subdomain)
echo      - Service: http://localhost:8000
echo.
pause
