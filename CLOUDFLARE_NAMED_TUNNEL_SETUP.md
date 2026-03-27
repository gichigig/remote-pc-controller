# Cloudflare Named Tunnel Setup (No Domain Required)

Complete guide to create a **permanent, free Cloudflare tunnel** without needing your own domain.

## What You'll Get

- **Permanent URL**: `https://pc-controller.trycloudflare.com` (doesn't change on restart)
- **Cost**: Free forever
- **Account**: Free Cloudflare account
- **Domain**: Not needed
- **HTTPS**: Automatic encryption

---

## Prerequisites

- Windows PC with admin access
- Backend server running on `localhost:8000`
- Free Cloudflare account (or create one)

---

## Step 1: Create Cloudflare Account

1. Go to https://dash.cloudflare.com/sign-up
2. Create a free account with email
3. Verify your email
4. Log in to the dashboard

---

## Step 2: Install Cloudflared

### Via WinGet (Easiest)

```powershell
winget install Cloudflare.cloudflared --source winget
```

### Verify Installation

```powershell
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
cloudflared --version
```

Should show: `cloudflared version 2025.x.x`

---

## Step 3: Access Zero Trust Dashboard

1. Go to https://one.dash.cloudflare.com
2. Click **Create account** (if new)
3. Complete the setup wizard (free plan is fine)
4. You'll see the **Zero Trust** dashboard

---

## Step 4: Create a Named Tunnel

### In Zero Trust Dashboard:

1. Click **Networks** (left sidebar)
2. Click **Tunnels**
3. Click **Create a tunnel**
4. Select **Cloudflared**
5. Click **Next**

### Name Your Tunnel

6. Enter a tunnel name: `pc-controller`
7. Click **Save tunnel**

### Get Your Token

8. You'll see a command like:
   ```
   cloudflared service install eyJhIjoiXXXXXXX...
   ```
   
   This is your tunnel token. **Copy the entire token** (the long `eyJ...` part after `service install`)

9. Don't run the command yet - we'll do it in Step 5

---

## Step 5: Install and Start the Tunnel

### Option A: Install as Windows Service (Recommended)

This makes it run automatically on startup.

1. **Open PowerShell as Administrator** (Right-click → Run as administrator)

2. Paste and run the command from Step 4:
   ```powershell
   cloudflared service install eyJhIjoiYOUR_FULL_TOKEN_HERE
   ```

3. You should see:
   ```
   INF cloudflared agent service is installed
   INF Agent service for cloudflared installed successfully
   ```

4. Start the service:
   ```powershell
   Start-Service Cloudflared
   ```

5. Verify it's running:
   ```powershell
   Get-Service Cloudflared | Format-List Name, Status
   ```

### Option B: Run in Terminal (Testing Only)

If you just want to test first:

```powershell
cloudflared tunnel run pc-controller
```

Leave this terminal open while using the tunnel.

---

## Step 6: Configure the Public Hostname

Back in the Cloudflare Zero Trust dashboard:

1. You should still be in the tunnel creation page
2. Click **Next** to see "Route traffic"
3. Click **Public Hostname** tab
4. Click **Add a public hostname**

### Fill in the Route:

- **Subdomain**: `pc-controller` (or any name you want)
- **Domain**: `trycloudflare.com`
- **Type**: `HTTP`
- **URL**: `localhost:8000`

5. Click **Save**

### Your URL is:

```
https://pc-controller.trycloudflare.com
```

This URL **never changes** and will work forever (as long as the service is running)!

---

## Step 7: Test the Connection

### From PowerShell:

```powershell
curl https://pc-controller.trycloudflare.com/api/system/info
```

### From Browser:

Open: `https://pc-controller.trycloudflare.com/docs`

You should see FastAPI documentation.

---

## Step 8: Configure Frontend

1. Open your frontend at `http://localhost:3000`
2. Click the **WiFi icon** (⚙️) in the top-right corner
3. Enter the API URL:
   ```
   https://pc-controller.trycloudflare.com
   ```
4. Click **Save**

---

## Step 9: Access from Phone (Anywhere)

1. On your phone (any network), open a browser
2. Go to: `https://pc-controller.trycloudflare.com`
3. You should see your PC control interface
4. Control your PC from anywhere! 🎉

---

## Verify Service is Running

### Check Service Status

```powershell
Get-Service Cloudflared | Format-List Name, Status, DisplayName
```

Expected:
```
Name        : Cloudflared
Status      : Running
DisplayName : Cloudflared agent
```

### Check Service Auto-Start

```powershell
Get-Service Cloudflared | Format-List StartType
```

Should show: `StartType : Automatic`

---

## View Tunnel Status in Dashboard

1. Go to https://one.dash.cloudflare.com
2. Click **Networks** → **Tunnels**
3. Click your tunnel name `pc-controller`
4. You should see:
   - **Status**: Connected (green)
   - **Public Hostname**: `pc-controller.trycloudflare.com`
   - **Route**: `http://localhost:8000`

---

## How to Change the Tunnel Name

If you want a different subdomain:

1. In Zero Trust dashboard, go to your tunnel
2. Click **Configure**
3. Edit the public hostname
4. Change subdomain and save
5. Your new URL will be: `https://newname.trycloudflare.com`

---

## Service Management Commands

```powershell
# Check status
Get-Service Cloudflared

# Start service
Start-Service Cloudflared

# Stop service
Stop-Service Cloudflared

# Restart service
Restart-Service Cloudflared

# View logs
Get-EventLog -LogName Application -Source cloudflared -Newest 10
```

---

## Troubleshooting

### "Service cannot be started"

Make sure you're running PowerShell as **Administrator**.

### Backend not responding at tunnel URL

1. Check backend is running on port 8000:
   ```powershell
   Get-NetTCPConnection -LocalPort 8000
   ```

2. Start backend if needed:
   ```powershell
   cd C:\Users\billy\conroleer\backend
   python server.py
   ```

### Service won't start after reboot

1. Check if Cloudflared is installed in PATH:
   ```powershell
   cloudflared --version
   ```

2. Reinstall the service:
   ```powershell
   cloudflared service install YOUR_TOKEN
   ```

3. Start it:
   ```powershell
   Start-Service Cloudflared
   ```

### Need to reinstall service with different token

1. Uninstall old service:
   ```powershell
   cloudflared service uninstall
   ```

2. Install with new token:
   ```powershell
   cloudflared service install eyJ_YOUR_NEW_TOKEN
   ```

3. Start:
   ```powershell
   Start-Service Cloudflared
   ```

### Forgot your tunnel token?

Go back to Cloudflare Zero Trust dashboard:
1. **Networks** → **Tunnels**
2. Click your tunnel name
3. Click **Install connector**
4. Select **Windows**
5. Copy the full `cloudflared service install` command with the token

---

## Creating a Batch File for Quick Reference

Create `start-tunnel-info.bat` to quickly see your tunnel info:

```batch
@echo off
echo Your PC Controller Tunnel:
echo URL: https://pc-controller.trycloudflare.com
echo.
echo Service Status:
powershell -Command "Get-Service Cloudflared | Format-List Name, Status"
echo.
echo Backend Status (Port 8000):
powershell -Command "Get-NetTCPConnection -LocalPort 8000 -ErrorAction SilentlyContinue | Format-Table"
pause
```

---

## What This Setup Gives You

✅ **Permanent URL**: Stays the same forever  
✅ **No Domain Needed**: Uses free trycloudflare.com  
✅ **Auto-Start**: Runs automatically after Windows restart  
✅ **HTTPS**: Secure encrypted connection  
✅ **Free Forever**: No cost  
✅ **Production Ready**: Reliable and fast  
✅ **Global Access**: Works from anywhere in the world  

---

## Comparison: Quick Tunnel vs Named Tunnel

| Feature | Quick Tunnel | Named Tunnel |
|---------|--------------|--------------|
| Permanent URL | ❌ Changes on restart | ✅ Never changes |
| Requires Account | ❌ No | ✅ Yes (free) |
| Requires Domain | ❌ No | ❌ No |
| Setup Time | 30 seconds | 5 minutes |
| Auto-Start | ❌ No | ✅ Yes (as service) |
| Recommended For | Testing | Production |

**You're using Named Tunnel** - the best balance of simplicity and reliability!

---

## Next Steps

After getting the tunnel running:

1. ✅ Test from phone on same WiFi
2. ✅ Test from phone on different network
3. ✅ Test remote desktop control
4. ✅ Test keyboard/mouse control
5. ✅ Monitor tunnel status in Cloudflare dashboard

---

## Security Tips

### 1. Share URL Carefully
Your tunnel URL gives access to your PC. Only share with trusted people.

### 2. Monitor Cloudflare Dashboard
Regularly check for unusual activity:
1. Go to https://one.dash.cloudflare.com
2. Click **Tunnels**
3. Check connection logs

### 3. Add Authentication (Optional)
For extra security, add Cloudflare Access:
1. In your tunnel, click **Access** (if available)
2. Enable authentication
3. Requires login before accessing tunnel

### 4. Disable When Not Needed
If you don't need remote access:
```powershell
Stop-Service Cloudflared
```

Or disable auto-start:
```powershell
Set-Service Cloudflared -StartupType Disabled
```

---

## Support & Help

- **Cloudflare Docs**: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/
- **Zero Trust Dashboard**: https://one.dash.cloudflare.com
- **Tunnel Status**: https://status.cloudflare.com

Your PC is now remotely controllable from anywhere in the world! 🌍
