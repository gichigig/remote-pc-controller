"""
PC Control API Server
Full remote control of your PC via REST API and WebSocket
"""

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
import pyautogui
import subprocess
import os
import sys
import webbrowser
import psutil
import platform
import ctypes
import asyncio
import json
import base64
from io import BytesIO
import mss
import mss.tools

app = FastAPI(title="PC Control API", version="1.0.0")

# Enable CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Disable PyAutoGUI fail-safe for smoother control (be careful!)
pyautogui.FAILSAFE = False
pyautogui.PAUSE = 0.1

# Store connected WebSocket clients
connected_clients: List[WebSocket] = []

# ============== Models ==============

class CommandRequest(BaseModel):
    command: str
    args: Optional[dict] = None

class TypeRequest(BaseModel):
    text: str
    interval: Optional[float] = 0.02

class KeyRequest(BaseModel):
    key: str
    modifiers: Optional[List[str]] = None

class MouseMoveRequest(BaseModel):
    x: int
    y: int
    relative: Optional[bool] = False
    duration: Optional[float] = 0.1

class MouseClickRequest(BaseModel):
    button: Optional[str] = "left"
    clicks: Optional[int] = 1
    x: Optional[int] = None
    y: Optional[int] = None

class ScrollRequest(BaseModel):
    amount: int
    x: Optional[int] = None
    y: Optional[int] = None

class AppRequest(BaseModel):
    name: str
    path: Optional[str] = None

class WebsiteRequest(BaseModel):
    url: str

class FileRequest(BaseModel):
    path: str
    content: Optional[str] = None

class ProcessRequest(BaseModel):
    name: Optional[str] = None
    pid: Optional[int] = None

class VolumeRequest(BaseModel):
    level: Optional[int] = None  # 0-100
    action: Optional[str] = None  # up, down, mute

class BrightnessRequest(BaseModel):
    level: int  # 0-100

# ============== System Info ==============

@app.get("/api/system/info")
async def get_system_info():
    """Get comprehensive system information"""
    try:
        cpu_percent = psutil.cpu_percent(interval=1)
        memory = psutil.virtual_memory()
        disk = psutil.disk_usage('/')
        battery = psutil.sensors_battery()
        
        return {
            "status": "success",
            "data": {
                "platform": platform.system(),
                "platform_release": platform.release(),
                "platform_version": platform.version(),
                "architecture": platform.machine(),
                "hostname": platform.node(),
                "processor": platform.processor(),
                "cpu_cores": psutil.cpu_count(),
                "cpu_percent": cpu_percent,
                "memory_total": memory.total,
                "memory_available": memory.available,
                "memory_percent": memory.percent,
                "disk_total": disk.total,
                "disk_used": disk.used,
                "disk_free": disk.free,
                "disk_percent": disk.percent,
                "battery_percent": battery.percent if battery else None,
                "battery_plugged": battery.power_plugged if battery else None,
                "screen_size": pyautogui.size(),
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/system/processes")
async def get_processes():
    """Get list of running processes"""
    try:
        processes = []
        for proc in psutil.process_iter(['pid', 'name', 'cpu_percent', 'memory_percent']):
            try:
                processes.append(proc.info)
            except (psutil.NoSuchProcess, psutil.AccessDenied):
                pass
        return {"status": "success", "data": processes}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/system/kill-process")
async def kill_process(request: ProcessRequest):
    """Kill a process by name or PID"""
    try:
        killed = False
        for proc in psutil.process_iter(['pid', 'name']):
            try:
                if request.pid and proc.info['pid'] == request.pid:
                    proc.terminate()
                    killed = True
                    break
                elif request.name and request.name.lower() in proc.info['name'].lower():
                    proc.terminate()
                    killed = True
            except (psutil.NoSuchProcess, psutil.AccessDenied):
                pass
        
        return {"status": "success" if killed else "not_found", "killed": killed}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ============== Screenshot ==============

@app.get("/api/screenshot")
async def take_screenshot():
    """Take a screenshot and return as base64"""
    try:
        with mss.mss() as sct:
            monitor = sct.monitors[0]  # Full screen
            screenshot = sct.grab(monitor)
            
            # Convert to PNG bytes
            png_bytes = mss.tools.to_png(screenshot.rgb, screenshot.size)
            
            # Encode to base64
            base64_image = base64.b64encode(png_bytes).decode('utf-8')
            
            return {
                "status": "success",
                "image": f"data:image/png;base64,{base64_image}",
                "width": screenshot.width,
                "height": screenshot.height
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ============== Keyboard Control ==============

@app.post("/api/keyboard/type")
async def type_text(request: TypeRequest):
    """Type text"""
    try:
        pyautogui.write(request.text)
        return {"status": "success", "typed": request.text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/keyboard/press")
async def press_key(request: KeyRequest):
    """Press a key with optional modifiers"""
    try:
        if request.modifiers:
            pyautogui.hotkey(*request.modifiers, request.key)
        else:
            pyautogui.press(request.key)
        return {"status": "success", "key": request.key, "modifiers": request.modifiers}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/keyboard/hotkey")
async def press_hotkey(request: KeyRequest):
    """Press a keyboard shortcut"""
    try:
        keys = [request.key]
        if request.modifiers:
            keys = request.modifiers + keys
        pyautogui.hotkey(*keys)
        return {"status": "success", "keys": keys}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ============== Mouse Control ==============

@app.post("/api/mouse/move")
async def move_mouse(request: MouseMoveRequest):
    """Move mouse to position"""
    try:
        if request.relative:
            pyautogui.moveRel(request.x, request.y, duration=request.duration)
        else:
            pyautogui.moveTo(request.x, request.y, duration=request.duration)
        return {"status": "success", "position": pyautogui.position()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/mouse/click")
async def click_mouse(request: MouseClickRequest):
    """Click mouse button"""
    try:
        if request.x is not None and request.y is not None:
            pyautogui.click(request.x, request.y, clicks=request.clicks, button=request.button)
        else:
            pyautogui.click(clicks=request.clicks, button=request.button)
        return {"status": "success", "button": request.button, "clicks": request.clicks}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/mouse/scroll")
async def scroll_mouse(request: ScrollRequest):
    """Scroll mouse wheel"""
    try:
        if request.x is not None and request.y is not None:
            pyautogui.scroll(request.amount, request.x, request.y)
        else:
            pyautogui.scroll(request.amount)
        return {"status": "success", "amount": request.amount}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/mouse/position")
async def get_mouse_position():
    """Get current mouse position"""
    try:
        pos = pyautogui.position()
        return {"status": "success", "x": pos.x, "y": pos.y}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ============== Application Control ==============

APP_PATHS = {
    'notepad': 'notepad.exe',
    'calculator': 'calc.exe',
    'chrome': r'C:\Program Files\Google\Chrome\Application\chrome.exe',
    'firefox': r'C:\Program Files\Mozilla Firefox\firefox.exe',
    'edge': r'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe',
    'explorer': 'explorer.exe',
    'cmd': 'cmd.exe',
    'terminal': 'wt.exe',
    'paint': 'mspaint.exe',
    'vscode': r'C:\Users\%USERNAME%\AppData\Local\Programs\Microsoft VS Code\Code.exe',
    'task manager': 'taskmgr.exe',
    'settings': 'ms-settings:',
    'control panel': 'control.exe',
}

@app.post("/api/app/open")
async def open_application(request: AppRequest):
    """Open an application"""
    try:
        app_name = request.name.lower()
        
        if request.path:
            path = os.path.expandvars(request.path)
            subprocess.Popen(path, shell=True)
        elif app_name in APP_PATHS:
            path = os.path.expandvars(APP_PATHS[app_name])
            subprocess.Popen(path, shell=True)
        else:
            # Try to open using start command
            subprocess.Popen(f'start {app_name}', shell=True)
        
        return {"status": "success", "app": request.name}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/app/close")
async def close_application(request: AppRequest):
    """Close an application by name"""
    try:
        app_name = request.name.lower()
        killed = False
        
        for proc in psutil.process_iter(['name']):
            try:
                if app_name in proc.info['name'].lower():
                    proc.terminate()
                    killed = True
            except (psutil.NoSuchProcess, psutil.AccessDenied):
                pass
        
        return {"status": "success" if killed else "not_found", "app": request.name}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/app/list")
async def list_available_apps():
    """List available application shortcuts"""
    return {"status": "success", "apps": list(APP_PATHS.keys())}

# ============== Browser Control ==============

@app.post("/api/browser/open")
async def open_website(request: WebsiteRequest):
    """Open a website in default browser"""
    try:
        url = request.url
        if not url.startswith(('http://', 'https://')):
            url = f'https://{url}'
        webbrowser.open(url)
        return {"status": "success", "url": url}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ============== Window Control ==============

@app.post("/api/window/close")
async def close_window():
    """Close current window (Alt+F4)"""
    try:
        pyautogui.hotkey('alt', 'F4')
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/window/minimize")
async def minimize_window():
    """Minimize current window"""
    try:
        pyautogui.hotkey('win', 'down')
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/window/maximize")
async def maximize_window():
    """Maximize current window"""
    try:
        pyautogui.hotkey('win', 'up')
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/window/switch")
async def switch_window():
    """Switch window (Alt+Tab)"""
    try:
        pyautogui.hotkey('alt', 'tab')
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/window/desktop")
async def show_desktop():
    """Show desktop (Win+D)"""
    try:
        pyautogui.hotkey('win', 'd')
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ============== System Actions ==============

@app.post("/api/system/lock")
async def lock_computer():
    """Lock the computer"""
    try:
        ctypes.windll.user32.LockWorkStation()
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/system/sleep")
async def sleep_computer():
    """Put computer to sleep"""
    try:
        os.system("rundll32.exe powrprof.dll,SetSuspendState 0,1,0")
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/system/shutdown")
async def shutdown_computer():
    """Shutdown computer (with 60s delay)"""
    try:
        os.system("shutdown /s /t 60")
        return {"status": "success", "message": "Shutdown in 60 seconds. Run 'shutdown /a' to cancel."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/system/restart")
async def restart_computer():
    """Restart computer (with 60s delay)"""
    try:
        os.system("shutdown /r /t 60")
        return {"status": "success", "message": "Restart in 60 seconds. Run 'shutdown /a' to cancel."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/system/cancel-shutdown")
async def cancel_shutdown():
    """Cancel scheduled shutdown/restart"""
    try:
        os.system("shutdown /a")
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ============== Volume Control ==============

@app.post("/api/volume/control")
async def control_volume(request: VolumeRequest):
    """Control system volume"""
    try:
        if request.action == "up":
            for _ in range(5):
                pyautogui.press('volumeup')
        elif request.action == "down":
            for _ in range(5):
                pyautogui.press('volumedown')
        elif request.action == "mute":
            pyautogui.press('volumemute')
        
        return {"status": "success", "action": request.action}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ============== Media Control ==============

@app.post("/api/media/playpause")
async def media_playpause():
    """Play/Pause media"""
    try:
        pyautogui.press('playpause')
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/media/next")
async def media_next():
    """Next track"""
    try:
        pyautogui.press('nexttrack')
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/media/previous")
async def media_previous():
    """Previous track"""
    try:
        pyautogui.press('prevtrack')
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ============== Clipboard ==============

@app.post("/api/clipboard/copy")
async def clipboard_copy():
    """Copy (Ctrl+C)"""
    try:
        pyautogui.hotkey('ctrl', 'c')
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/clipboard/paste")
async def clipboard_paste():
    """Paste (Ctrl+V)"""
    try:
        pyautogui.hotkey('ctrl', 'v')
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/clipboard/cut")
async def clipboard_cut():
    """Cut (Ctrl+X)"""
    try:
        pyautogui.hotkey('ctrl', 'x')
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ============== File Operations ==============

@app.post("/api/file/open")
async def open_file(request: FileRequest):
    """Open a file with default application"""
    try:
        os.startfile(request.path)
        return {"status": "success", "path": request.path}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/file/list")
async def list_directory(path: str = "C:\\"):
    """List directory contents"""
    try:
        items = []
        for item in os.listdir(path):
            item_path = os.path.join(path, item)
            items.append({
                "name": item,
                "path": item_path,
                "is_dir": os.path.isdir(item_path),
                "size": os.path.getsize(item_path) if os.path.isfile(item_path) else None
            })
        return {"status": "success", "path": path, "items": items}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ============== Command Execution ==============

@app.post("/api/command/run")
async def run_command(request: CommandRequest):
    """Run a shell command"""
    try:
        result = subprocess.run(
            request.command,
            shell=True,
            capture_output=True,
            text=True,
            timeout=30
        )
        return {
            "status": "success",
            "stdout": result.stdout,
            "stderr": result.stderr,
            "returncode": result.returncode
        }
    except subprocess.TimeoutExpired:
        raise HTTPException(status_code=408, detail="Command timed out")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ============== WebSocket for Real-time Control ==============

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket for real-time control and screen streaming"""
    await websocket.accept()
    connected_clients.append(websocket)
    
    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            
            action = message.get("action")
            params = message.get("params", {})
            
            response = {"action": action, "status": "success"}
            
            try:
                if action == "mouse_move":
                    pyautogui.moveTo(params["x"], params["y"], duration=0.05)
                elif action == "mouse_click":
                    pyautogui.click(button=params.get("button", "left"))
                elif action == "mouse_scroll":
                    pyautogui.scroll(params["amount"])
                elif action == "key_press":
                    if params.get("modifiers"):
                        pyautogui.hotkey(*params["modifiers"], params["key"])
                    else:
                        pyautogui.press(params["key"])
                elif action == "type":
                    pyautogui.write(params["text"])
                elif action == "screenshot":
                    with mss.mss() as sct:
                        monitor = sct.monitors[0]
                        screenshot = sct.grab(monitor)
                        png_bytes = mss.tools.to_png(screenshot.rgb, screenshot.size)
                        base64_image = base64.b64encode(png_bytes).decode('utf-8')
                        response["image"] = f"data:image/png;base64,{base64_image}"
                elif action == "get_position":
                    pos = pyautogui.position()
                    response["x"] = pos.x
                    response["y"] = pos.y
                else:
                    response["status"] = "unknown_action"
                    
            except Exception as e:
                response["status"] = "error"
                response["error"] = str(e)
            
            await websocket.send_text(json.dumps(response))
            
    except WebSocketDisconnect:
        connected_clients.remove(websocket)

# ============== Health Check ==============

@app.get("/api/health")
async def health_check():
    """API health check"""
    return {"status": "healthy", "message": "PC Control API is running"}

if __name__ == "__main__":
    import uvicorn
    print("=" * 50)
    print("   🖥️  PC Control API Server 🖥️")
    print("=" * 50)
    print("\nStarting server on http://localhost:8000")
    print("API docs available at http://localhost:8000/docs")
    print("\nPress Ctrl+C to stop")
    uvicorn.run(app, host="0.0.0.0", port=8000)
