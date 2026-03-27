# Cloudflare Tunnel Setup Guide

Complete guide to create a permanent Cloudflare Tunnel for remote PC control.

## Prerequisites

- Windows PC with admin access
- Backend server running on `localhost:8000`
- Cloudflare account (free)

---

## Step 1: Create Cloudflare Account

1. Go to https://dash.cloudflare.com/sign-up
2. Create a free account
3. Verify your email address
4. Log in to the dashboard

---

## Step 2: Access Zero Trust Dashboard

1. In Cloudflare dashboard, click **Zero Trust** in the left sidebar
2. Or go directly to: https://one.dash.cloudflare.com
3. Complete the initial Zero Trust setup if prompted (free plan is fine)

---

## Step 3: Create a New Tunnel

1. Navigate to **Networks** → **Tunnels** (left sidebar)
2. Click **Create a tunnel** button
3. Select **Cloudflared** as the connector type
4. Click **Next**

### Name Your Tunnel

5. Enter a tunnel name (e.g., `pc-controller`)
6. Click **Save tunnel**

---

## Step 4: Install Cloudflared on Windows

### Option A: Already Installed (Skip if Done)

If you've already installed cloudflared:
```powershell
cloudflared --version
```

### Option B: Install via WinGet

```powershell
winget install Cloudflare.cloudflared --source winget
```

### Verify Installation

```powershell
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
cloudflared --version
```

---

## Step 5: Install Tunnel Connector

1. In the Cloudflare dashboard, you'll see **Install and run a connector**
2. Select **Windows** as your environment
3. Copy the command that looks like:
   ```
   cloudflared.exe service install eyJhIjoiXXXXXXX...
   ```
   *(This contains your tunnel token)*

4. **Run PowerShell as Administrator** (Right-click → Run as administrator)
5. Paste and run the command:
   ```powershell
   cloudflared.exe service install eyJhIjoiYOUR_TUNNEL_TOKEN_HERE...
   ```

6. You should see:
   ```
   INF cloudflared agent service is installed
   INF Agent service for cloudflared installed successfully
   ```

---

## Step 6: Start the Service

### Start Service
```powershell
Start-Service Cloudflared
```

### Check Service Status
```powershell
Get-Service Cloudflared | Format-List Name, Status, DisplayName
```

Expected output:
```
Name        : Cloudflared
Status      : Running
DisplayName : Cloudflared agent
```

---

## Step 7: Configure Public Hostname Route

1. Back in the Cloudflare dashboard, click **Next** after installing the connector
2. You'll see the **Route traffic** section

### Add a Public Hostname

3. Select **Hostname routes** tab (not CIDR or Published apps)
4. Click **Add a public hostname**

### Configure the Route

Fill in the following fields:

4. **Hostname** (Required):
   - Enter: `pc-controller.yourdomain.com`
   - Or: `subdomain.yourdomain.com`
   - *(Replace `yourdomain.com` with your actual Cloudflare domain)*

5. **Description** (Optional):
   - Enter: `PC Remote Control Backend`
   - Or leave blank

6. **Type**: HTTP

7. **URL**: `localhost:8000`

8. Click **Save**

### Your Permanent URL

You'll get a URL like:
```
https://pc-controller.yourdomain.com
```

---

## Step 8: Test the Connection

### Test from Command Line
```powershell
curl https://pc-controller.yourdomain.com/api/system/info
```

### Test from Browser
Open: `https://pc-controller.yourdomain.com/docs`

You should see the FastAPI documentation page.

---

## Step 9: Configure Frontend

1. Open your frontend at `http://localhost:3000`
2. Click the **WiFi icon** (⚙️) in the top-right corner
3. Update the API URL to your permanent tunnel URL:
   ```
   https://pc-controller.yourdomain.com
   ```
4. Click **Save**

---

## Step 10: Access from Phone

1. On your phone, open a browser
2. Go to `http://localhost:3000` OR deploy your frontend to Vercel/Netlify
3. The frontend will connect to your PC through the tunnel
4. Control your PC from anywhere! 🎉

---

## Additional Configuration

### Set Service to Auto-Start

The service is already configured to start automatically with Windows.

To verify:
```powershell
Get-Service Cloudflared | Format-List StartType
```

Should show: `StartType : Automatic`

### View Service Logs

```powershell
Get-EventLog -LogName Application -Source cloudflared -Newest 10
```

Or check: `C:\Users\YOUR_USERNAME\.cloudflared\cloudflared.log`

### Restart Service

If you need to restart:
```powershell
Restart-Service Cloudflared
```

### Stop Service

```powershell
Stop-Service Cloudflared
```

---

## Troubleshooting

### Backend Not Responding

Check if backend is running on port 8000:
```powershell
Get-NetTCPConnection -LocalPort 8000 -ErrorAction SilentlyContinue
```

Start backend if needed:
```powershell
cd C:\Users\billy\conroleer\backend
python server.py
```

### Tunnel Service Not Running

```powershell
Get-Service Cloudflared
Start-Service Cloudflared
```

### Wrong URL in Tunnel Route

1. Go to Cloudflare dashboard
2. Navigate to your tunnel
3. Click **Configure**
4. Edit the public hostname
5. Change URL to `localhost:8000`
6. Save

### Need Multiple Routes

You can add multiple hostnames:
- `api.yourdomain.com` → `localhost:8000` (backend)
- `app.yourdomain.com` → `localhost:3000` (frontend)

---

## Security Recommendations

### 1. Add Authentication
Consider adding Cloudflare Access to require login before accessing your tunnel.

### 2. Restrict IPs (Optional)
In Cloudflare, you can limit access to specific countries or IP ranges.

### 3. Use HTTPS Only
Cloudflare tunnels provide automatic HTTPS encryption.

### 4. Monitor Usage
Check the tunnel usage in the Cloudflare dashboard regularly.

---

## Useful Commands Reference

```powershell
# Check service status
Get-Service Cloudflared

# Start service
Start-Service Cloudflared

# Stop service
Stop-Service Cloudflared

# Restart service
Restart-Service Cloudflared

# Check if backend is running
Get-NetTCPConnection -LocalPort 8000

# Test tunnel connection
curl https://your-subdomain.yourdomain.com/api/system/info
```

---

## Notes

- **Free Plan**: Cloudflare Tunnel is free with no bandwidth limits
- **Automatic HTTPS**: All traffic is automatically encrypted
- **No Port Forwarding**: Works without opening firewall ports
- **No Static IP Needed**: Works from any network
- **Survives Reboots**: Service starts automatically with Windows

---

## What You've Achieved

✅ Permanent public URL for your PC  
✅ Secure HTTPS encryption  
✅ Access from any device, any network  
✅ No router configuration needed  
✅ Auto-starts with Windows  

Your PC is now remotely controllable from anywhere in the world! 🌍
