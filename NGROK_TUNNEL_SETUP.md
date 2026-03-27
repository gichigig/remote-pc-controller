# Ngrok Tunnel Setup Guide

Complete guide to create a permanent public URL using ngrok for remote PC control.

## Prerequisites

- Windows PC with admin access
- Backend server running on `localhost:8000`
- Ngrok account (free)

---

## Step 1: Create Ngrok Account

1. Go to https://ngrok.com/
2. Click **Sign Up** (top right)
3. Create a free account using email or GitHub
4. Verify your email

---

## Step 2: Get Your Authtoken

1. Log in to https://dashboard.ngrok.com
2. Go to **Auth** (left sidebar)
3. Copy your **Authtoken** - it looks like:
   ```
   39EAZQSqOiT8N7OsubyXqLH3ekU_673UdTuwe6M2L6kczwgwg
   ```
   (This is your unique authentication key)

---

## Step 3: Install Ngrok on Windows

### Option A: Using WinGet (Recommended)

```powershell
winget install ngrok
```

### Option B: Manual Download

1. Go to https://ngrok.com/download
2. Download the Windows version
3. Extract the `ngrok.exe` to a folder (e.g., `C:\ngrok`)

### Verify Installation

```powershell
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
ngrok --version
```

Should show version 3.x or higher.

---

## Step 4: Configure Authtoken

Add your authentication token to ngrok:

```powershell
ngrok config add-authtoken 39EAZQSqOiT8N7OsubyXqLH3ekU_673UdTuwe6M2L6kczwgwg
```

Replace with your actual token from Step 2.

Expected output:
```
Authtoken saved to configuration file
```

---

## Step 5: Start Ngrok Tunnel

### Basic Command

Open PowerShell and run:

```powershell
ngrok http 8000
```

### Expected Output

You should see:
```
Session Status                online
Account                       your-email@example.com
Version                       3.x.x
Region                        us,eu,au
Forwarding                    https://abc123-456.ngrok.io -> http://localhost:8000
Forwarding                    http://abc123-456.ngrok.io -> http://localhost:8000
Web Interface                 http://127.0.0.1:4040
```

Your public URL is: `https://abc123-456.ngrok.io`

---

## Step 6: Keep Ngrok Running

**Important**: The terminal window with ngrok must stay open for the tunnel to work. Don't close it.

### Option: Create a Batch File for Easy Start

Create a file called `start-ngrok.bat` in your project folder:

```batch
@echo off
cd C:\Users\billy\conroleer
set Path=%Path%;C:\Users\billy\AppData\Local\Microsoft\WinGet\Links
ngrok http 8000
pause
```

Then double-click it to start ngrok.

---

## Step 7: Test the Connection

### Test from Command Line (in another terminal)

```powershell
curl https://abc123-456.ngrok.io/api/system/info
```

### Test from Browser

Open: `https://abc123-456.ngrok.io/docs`

You should see the FastAPI documentation page.

---

## Step 8: Configure Frontend

1. Open your frontend at `http://localhost:3000`
2. Click the **WiFi icon** (⚙️) in the top-right corner
3. Update the API URL to your ngrok URL:
   ```
   https://abc123-456.ngrok.io
   ```
4. Click **Save**

---

## Step 9: Access from Phone

1. On your phone, open a browser
2. Go to `https://abc123-456.ngrok.io`
3. You should see your control interface
4. Control your PC from anywhere! 🎉

---

## Getting a Permanent Custom Domain (Pro Plan)

The free ngrok plan gives you a random domain that changes each time you restart.

### For Permanent URL, Upgrade to Pro:

1. Go to https://dashboard.ngrok.com/billing/plan
2. Upgrade to **Pro Plan** ($5/month)
3. In your account, go to **Domains**
4. Click **Create Domain**
5. Choose a custom domain (e.g., `pc-controller.ngrok.io`)
6. Use in your ngrok command:
   ```powershell
   ngrok http 8000 --domain pc-controller.ngrok.io
   ```

---

## Advanced: Ngrok Configuration File

Create a config file for easier setup:

**Location**: `C:\Users\YOUR_USERNAME\.ngrok2\ngrok.yml`

**Content**:
```yaml
authtoken: 39EAZQSqOiT8N7OsubyXqLH3ekU_673UdTuwe6M2L6kczwgwg
tunnels:
  pc-backend:
    proto: http
    addr: 8000
    domain: pc-controller.ngrok.io
```

Then run:
```powershell
ngrok start pc-backend
```

---

## Monitoring & Debugging

### View Traffic Inspector

While ngrok is running, open in browser:
```
http://127.0.0.1:4040
```

This shows all requests going through your tunnel.

### View Logs

Check the ngrok dashboard at https://dashboard.ngrok.com for:
- Connection logs
- Bandwidth usage
- Error messages

---

## Troubleshooting

### "Invalid authtoken" Error

1. Check your token is correct in dashboard
2. Reconfigure:
   ```powershell
   ngrok config add-authtoken YOUR_CORRECT_TOKEN
   ```

### Backend Not Responding

Check if backend is running:
```powershell
Get-NetTCPConnection -LocalPort 8000 -ErrorAction SilentlyContinue
```

Start backend if needed:
```powershell
cd C:\Users\billy\conroleer\backend
python server.py
```

### "Connection refused" Error

Make sure:
1. Backend is running on `localhost:8000`
2. Port 8000 is open (firewall)
3. Ngrok is running (`ngrok http 8000`)

### URL Changed After Restart

On free plan, the URL changes every time you start ngrok. Either:
1. Update frontend API URL each time
2. Upgrade to Pro plan for permanent domain
3. Use Cloudflare tunnel instead (free permanent URL)

---

## Free vs Pro Plan Comparison

| Feature | Free | Pro |
|---------|------|-----|
| Tunnels | 1 | Unlimited |
| Bandwidth | Limited | Unlimited |
| Custom Domain | ❌ | ✅ |
| HTTPS | ✅ | ✅ |
| Inspecting Traffic | ✅ | ✅ |
| OAuth/SAML | ❌ | ✅ |
| IP Restrictions | ❌ | ✅ |
| Cost | Free | $5/month |

---

## Keeping Ngrok Running Permanently

### Option 1: Batch Script with Loop

Create `start-ngrok-loop.bat`:

```batch
@echo off
setlocal enabledelayedexpansion

:loop
echo Starting ngrok...
ngrok http 8000
echo Tunnel closed, restarting in 5 seconds...
timeout /t 5
goto loop
```

### Option 2: Windows Task Scheduler

1. Open **Task Scheduler**
2. Create Basic Task
3. Set trigger to "At startup"
4. Set action to run the batch file
5. Enable "Run with highest privileges"

### Option 3: Use Screen/Tmux (via Git Bash)

```bash
screen -S ngrok -d -m ngrok http 8000
```

---

## Useful Commands

```powershell
# Check ngrok version
ngrok --version

# View all tunnels
ngrok api tunnels list

# View connection details
ngrok inspect

# List running sessions
ngrok api sessions list

# Kill all ngrok processes
Get-Process ngrok -ErrorAction SilentlyContinue | Stop-Process -Force
```

---

## What You've Achieved

✅ Public URL for your PC (e.g., `https://abc123.ngrok.io`)  
✅ Works from any network, any device  
✅ Secure HTTPS by default  
✅ Traffic inspection for debugging  
✅ Easy to share URL with others  

Your PC is now remotely controllable from anywhere! 🌍

---

## Ngrok vs Cloudflare Comparison

| Feature | Ngrok | Cloudflare |
|---------|-------|-----------|
| Free Permanent URL | ❌ (changes each restart) | ✅ |
| Pro Permanent URL | ✅ ($5/month) | ✅ (free) |
| Setup Difficulty | Easy | Medium |
| Performance | Good | Excellent |
| Cost | $0-5/month | Free |
| Best For | Testing, Demos | Production |

**Recommendation**: Use Cloudflare for production, Ngrok for quick testing.
