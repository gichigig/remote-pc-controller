"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Monitor,
  Mouse,
  Keyboard,
  Volume2,
  VolumeX,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Power,
  Lock,
  Moon,
  RefreshCw,
  Maximize2,
  Minimize2,
  X,
  Copy,
  Clipboard,
  Scissors,
  Undo2,
  Redo2,
  Save,
  FolderOpen,
  Terminal,
  Globe,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Home as HomeIcon,
  Settings,
  Cpu,
  HardDrive,
  MemoryStick,
  Battery,
  Wifi,
  Camera,
  Send,
  ChevronUp,
  ChevronDown,
  Plus,
  Minus,
  LayoutGrid,
  Activity,
} from "lucide-react";

// API URL Configuration
// For local network: uses same hostname as frontend
// For ngrok/cloudflare: set custom URL in settings
const DEFAULT_API_URL = "http://localhost:8000";

const getApiUrl = () => {
  if (typeof window === 'undefined') return DEFAULT_API_URL;
  
  // Check for custom API URL in localStorage
  const customUrl = localStorage.getItem('pc_controller_api_url');
  if (customUrl && customUrl.startsWith('http')) return customUrl;
  
  // Default: same host as frontend, port 8000
  const hostname = window.location.hostname;
  if (hostname && hostname !== '') {
    return `http://${hostname}:8000`;
  }
  return DEFAULT_API_URL;
};

interface SystemInfo {
  platform: string;
  hostname: string;
  cpu_percent: number;
  memory_percent: number;
  disk_percent: number;
  battery_percent: number | null;
  battery_plugged: boolean | null;
  screen_size: [number, number];
}

export default function Home() {
  const [activeTab, setActiveTab] = useState("remote");
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [textToType, setTextToType] = useState("");
  const [commandOutput, setCommandOutput] = useState("");
  const [customCommand, setCustomCommand] = useState("");
  const [apiUrl, setApiUrl] = useState(DEFAULT_API_URL);
  const [showSettings, setShowSettings] = useState(false);
  const [apiUrlInput, setApiUrlInput] = useState(DEFAULT_API_URL);
  const [appName, setAppName] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const screenshotRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // Initialize API URL from localStorage or auto-detect
  useEffect(() => {
    const url = getApiUrl();
    setApiUrl(url);
    setApiUrlInput(url);
  }, []);

  // Check API connection
  useEffect(() => {
    if (!apiUrl) return;
    checkConnection();
    const interval = setInterval(checkConnection, 5000);
    return () => clearInterval(interval);
  }, [apiUrl]);

  // Fetch system info periodically
  useEffect(() => {
    if (isConnected) {
      fetchSystemInfo();
      const interval = setInterval(fetchSystemInfo, 3000);
      return () => clearInterval(interval);
    }
  }, [isConnected]);

  const checkConnection = async () => {
    try {
      const res = await fetch(`${apiUrl}/api/health`);
      setIsConnected(res.ok);
    } catch {
      setIsConnected(false);
    }
  };

  const saveApiUrl = () => {
    // Validate URL starts with http:// or https://
    let url = apiUrlInput.trim();
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'http://' + url;
    }
    // Remove trailing slash
    url = url.replace(/\/$/, '');
    
    localStorage.setItem('pc_controller_api_url', url);
    setApiUrl(url);
    setApiUrlInput(url);
    setShowSettings(false);
  };

  const fetchSystemInfo = async () => {
    try {
      const res = await fetch(`${apiUrl}/api/system/info`);
      const data = await res.json();
      if (data.status === "success") {
        setSystemInfo(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch system info:", error);
    }
  };

  const apiCall = async (endpoint: string, method = "POST", body?: object) => {
    try {
      setIsLoading(true);
      const res = await fetch(`${apiUrl}${endpoint}`, {
        method,
        headers: { "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : undefined,
      });
      const data = await res.json();
      return data;
    } catch (error) {
      console.error("API Error:", error);
      return { status: "error", message: String(error) };
    } finally {
      setIsLoading(false);
    }
  };

  const takeScreenshot = async () => {
    const data = await apiCall("/api/screenshot", "GET");
    if (data.status === "success") {
      setScreenshot(data.image);
    }
  };

  const handleScreenClick = useCallback(
    async (e: React.MouseEvent<HTMLDivElement>) => {
      if (!screenshot || !screenshotRef.current || !systemInfo) return;

      const rect = screenshotRef.current.getBoundingClientRect();
      const scaleX = systemInfo.screen_size[0] / rect.width;
      const scaleY = systemInfo.screen_size[1] / rect.height;

      const x = Math.round((e.clientX - rect.left) * scaleX);
      const y = Math.round((e.clientY - rect.top) * scaleY);

      await apiCall("/api/mouse/click", "POST", { x, y, button: "left" });
      setTimeout(takeScreenshot, 200);
    },
    [screenshot, systemInfo]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!screenshotRef.current || !systemInfo) return;

      const rect = screenshotRef.current.getBoundingClientRect();
      const scaleX = systemInfo.screen_size[0] / rect.width;
      const scaleY = systemInfo.screen_size[1] / rect.height;

      setMousePosition({
        x: Math.round((e.clientX - rect.left) * scaleX),
        y: Math.round((e.clientY - rect.top) * scaleY),
      });
    },
    [systemInfo]
  );

  // Keyboard shortcuts
  const pressKey = async (key: string, modifiers?: string[]) => {
    await apiCall("/api/keyboard/press", "POST", { key, modifiers });
  };

  const typeText = async () => {
    if (!textToType) return;
    await apiCall("/api/keyboard/type", "POST", { text: textToType });
    setTextToType("");
  };

  const runCommand = async () => {
    if (!customCommand) return;
    const data = await apiCall("/api/command/run", "POST", {
      command: customCommand,
    });
    setCommandOutput(data.stdout || data.stderr || JSON.stringify(data));
  };

  const openApp = async () => {
    if (!appName) return;
    await apiCall("/api/app/open", "POST", { name: appName });
    setAppName("");
  };

  const openWebsite = async () => {
    if (!websiteUrl) return;
    await apiCall("/api/browser/open", "POST", { url: websiteUrl });
    setWebsiteUrl("");
  };

  const tabs = [
    { id: "remote", label: "Remote Desktop", icon: Monitor },
    { id: "keyboard", label: "Keyboard", icon: Keyboard },
    { id: "apps", label: "Apps", icon: LayoutGrid },
    { id: "system", label: "System", icon: Settings },
    { id: "terminal", label: "Terminal", icon: Terminal },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl p-6 max-w-md w-full border border-gray-700">
            <h2 className="text-xl font-bold mb-4">API Settings</h2>
            <p className="text-sm text-gray-400 mb-4">
              For remote access (different network), enter your ngrok URL or public IP.
            </p>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-400 block mb-2">Backend API URL</label>
                <input
                  type="text"
                  value={apiUrlInput}
                  onChange={(e) => setApiUrlInput(e.target.value)}
                  placeholder="http://localhost:8000 or https://xxxx.ngrok.io"
                  className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>
              <div className="text-xs text-gray-500">
                <p>Examples:</p>
                <p>• Local: http://localhost:8000</p>
                <p>• Local network: http://192.168.1.100:8000</p>
                <p>• Ngrok: https://abc123.ngrok.io</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowSettings(false)}
                  className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={saveApiUrl}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg"
                >
                  Save & Connect
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="border-b border-gray-700 bg-gray-900/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Monitor className="h-8 w-8 text-blue-500" />
              <h1 className="text-2xl font-bold">PC Controller</h1>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowSettings(true)}
                className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
                title="API Settings"
              >
                <Wifi className="h-5 w-5" />
              </button>
              <div
                className={`flex items-center gap-2 rounded-full px-4 py-2 ${
                  isConnected
                    ? "bg-green-500/20 text-green-400"
                    : "bg-red-500/20 text-red-400"
                }`}
              >
                <div
                  className={`h-2 w-2 rounded-full ${
                    isConnected ? "bg-green-500" : "bg-red-500"
                  }`}
                />
                {isConnected ? "Connected" : "Disconnected"}
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        {/* Connection Warning */}
        {!isConnected && (
          <div className="mb-6 rounded-lg bg-red-500/20 border border-red-500/50 p-4 text-center">
            <p className="text-red-300">
              ⚠️ Cannot connect to PC Control API. Make sure the Python server
              is running on{" "}
              <code className="bg-red-500/30 px-2 py-1 rounded">
                localhost:8000
              </code>
            </p>
            <p className="text-sm text-red-400 mt-2">
              Run: <code className="bg-red-500/30 px-2 py-1 rounded">python server.py</code> in the backend folder
            </p>
          </div>
        )}

        {/* System Stats Bar */}
        {systemInfo && (
          <div className="mb-6 grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              icon={<Cpu className="h-5 w-5" />}
              label="CPU"
              value={`${systemInfo.cpu_percent}%`}
              color="blue"
            />
            <StatCard
              icon={<MemoryStick className="h-5 w-5" />}
              label="Memory"
              value={`${systemInfo.memory_percent}%`}
              color="purple"
            />
            <StatCard
              icon={<HardDrive className="h-5 w-5" />}
              label="Disk"
              value={`${systemInfo.disk_percent}%`}
              color="orange"
            />
            <StatCard
              icon={<Battery className="h-5 w-5" />}
              label="Battery"
              value={
                systemInfo.battery_percent
                  ? `${systemInfo.battery_percent}%`
                  : "N/A"
              }
              color="green"
            />
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? "bg-blue-600 text-white"
                  : "bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white"
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6">
          {/* Remote Desktop Tab */}
          {activeTab === "remote" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Remote Desktop</h2>
                <div className="flex gap-2">
                  <button
                    onClick={takeScreenshot}
                    disabled={!isConnected || isLoading}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg transition-colors"
                  >
                    <Camera className="h-4 w-4" />
                    {isLoading ? "Loading..." : "Capture Screen"}
                  </button>
                  <button
                    onClick={() =>
                      setInterval(() => takeScreenshot(), 1000)
                    }
                    disabled={!isConnected}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg transition-colors"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Auto Refresh
                  </button>
                </div>
              </div>

              {screenshot ? (
                <div className="relative">
                  <div
                    ref={screenshotRef}
                    onClick={handleScreenClick}
                    onMouseMove={handleMouseMove}
                    onContextMenu={async (e) => {
                      e.preventDefault();
                      if (!screenshotRef.current || !systemInfo) return;
                      const rect =
                        screenshotRef.current.getBoundingClientRect();
                      const scaleX = systemInfo.screen_size[0] / rect.width;
                      const scaleY = systemInfo.screen_size[1] / rect.height;
                      const x = Math.round((e.clientX - rect.left) * scaleX);
                      const y = Math.round((e.clientY - rect.top) * scaleY);
                      await apiCall("/api/mouse/click", "POST", {
                        x,
                        y,
                        button: "right",
                      });
                      setTimeout(takeScreenshot, 200);
                    }}
                    className="cursor-crosshair rounded-lg overflow-hidden border border-gray-600"
                  >
                    <img
                      src={screenshot}
                      alt="Remote Screen"
                      className="w-full h-auto"
                    />
                  </div>
                  <div className="absolute bottom-2 right-2 bg-black/70 px-3 py-1 rounded text-sm">
                    Mouse: {mousePosition.x}, {mousePosition.y}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-64 bg-gray-900 rounded-lg border-2 border-dashed border-gray-700">
                  <Monitor className="h-16 w-16 text-gray-600 mb-4" />
                  <p className="text-gray-400">
                    Click &quot;Capture Screen&quot; to view remote desktop
                  </p>
                </div>
              )}

              {/* Quick Mouse Controls */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <button
                  onClick={() =>
                    apiCall("/api/mouse/scroll", "POST", { amount: 3 })
                  }
                  className="flex items-center justify-center gap-2 p-3 bg-gray-700 hover:bg-gray-600 rounded-lg"
                >
                  <ChevronUp className="h-5 w-5" />
                  Scroll Up
                </button>
                <button
                  onClick={() =>
                    apiCall("/api/mouse/scroll", "POST", { amount: -3 })
                  }
                  className="flex items-center justify-center gap-2 p-3 bg-gray-700 hover:bg-gray-600 rounded-lg"
                >
                  <ChevronDown className="h-5 w-5" />
                  Scroll Down
                </button>
                <button
                  onClick={() =>
                    apiCall("/api/mouse/click", "POST", { button: "left" })
                  }
                  className="flex items-center justify-center gap-2 p-3 bg-gray-700 hover:bg-gray-600 rounded-lg"
                >
                  <Mouse className="h-5 w-5" />
                  Left Click
                </button>
                <button
                  onClick={() =>
                    apiCall("/api/mouse/click", "POST", { button: "right" })
                  }
                  className="flex items-center justify-center gap-2 p-3 bg-gray-700 hover:bg-gray-600 rounded-lg"
                >
                  <Mouse className="h-5 w-5" />
                  Right Click
                </button>
              </div>
            </div>
          )}

          {/* Keyboard Tab */}
          {activeTab === "keyboard" && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold">Keyboard Control</h2>

              {/* Text Input */}
              <div className="space-y-3">
                <label className="text-sm text-gray-400">Type Text</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={textToType}
                    onChange={(e) => setTextToType(e.target.value)}
                    placeholder="Enter text to type..."
                    className="flex-1 px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500"
                    onKeyDown={(e) => e.key === "Enter" && typeText()}
                  />
                  <button
                    onClick={typeText}
                    disabled={!isConnected || !textToType}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded-lg"
                  >
                    <Send className="h-4 w-4" />
                    Type
                  </button>
                </div>
              </div>

              {/* Common Keys */}
              <div className="space-y-3">
                <label className="text-sm text-gray-400">Common Keys</label>
                <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
                  {[
                    "enter",
                    "tab",
                    "space",
                    "backspace",
                    "delete",
                    "escape",
                    "home",
                    "end",
                  ].map((key) => (
                    <button
                      key={key}
                      onClick={() => pressKey(key)}
                      disabled={!isConnected}
                      className="px-3 py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 rounded-lg text-sm capitalize"
                    >
                      {key}
                    </button>
                  ))}
                </div>
              </div>

              {/* Arrow Keys */}
              <div className="space-y-3">
                <label className="text-sm text-gray-400">Arrow Keys</label>
                <div className="flex justify-center">
                  <div className="grid grid-cols-3 gap-2 w-fit">
                    <div />
                    <button
                      onClick={() => pressKey("up")}
                      className="p-3 bg-gray-700 hover:bg-gray-600 rounded-lg"
                    >
                      <ArrowUp className="h-5 w-5 mx-auto" />
                    </button>
                    <div />
                    <button
                      onClick={() => pressKey("left")}
                      className="p-3 bg-gray-700 hover:bg-gray-600 rounded-lg"
                    >
                      <ArrowLeft className="h-5 w-5 mx-auto" />
                    </button>
                    <button
                      onClick={() => pressKey("down")}
                      className="p-3 bg-gray-700 hover:bg-gray-600 rounded-lg"
                    >
                      <ArrowDown className="h-5 w-5 mx-auto" />
                    </button>
                    <button
                      onClick={() => pressKey("right")}
                      className="p-3 bg-gray-700 hover:bg-gray-600 rounded-lg"
                    >
                      <ArrowRight className="h-5 w-5 mx-auto" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Shortcuts */}
              <div className="space-y-3">
                <label className="text-sm text-gray-400">
                  Keyboard Shortcuts
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <ShortcutButton
                    icon={<Copy className="h-4 w-4" />}
                    label="Copy"
                    onClick={() => pressKey("c", ["ctrl"])}
                    disabled={!isConnected}
                  />
                  <ShortcutButton
                    icon={<Clipboard className="h-4 w-4" />}
                    label="Paste"
                    onClick={() => pressKey("v", ["ctrl"])}
                    disabled={!isConnected}
                  />
                  <ShortcutButton
                    icon={<Scissors className="h-4 w-4" />}
                    label="Cut"
                    onClick={() => pressKey("x", ["ctrl"])}
                    disabled={!isConnected}
                  />
                  <ShortcutButton
                    icon={<Undo2 className="h-4 w-4" />}
                    label="Undo"
                    onClick={() => pressKey("z", ["ctrl"])}
                    disabled={!isConnected}
                  />
                  <ShortcutButton
                    icon={<Redo2 className="h-4 w-4" />}
                    label="Redo"
                    onClick={() => pressKey("y", ["ctrl"])}
                    disabled={!isConnected}
                  />
                  <ShortcutButton
                    icon={<Save className="h-4 w-4" />}
                    label="Save"
                    onClick={() => pressKey("s", ["ctrl"])}
                    disabled={!isConnected}
                  />
                  <ShortcutButton
                    label="Select All"
                    onClick={() => pressKey("a", ["ctrl"])}
                    disabled={!isConnected}
                  />
                  <ShortcutButton
                    label="Find"
                    onClick={() => pressKey("f", ["ctrl"])}
                    disabled={!isConnected}
                  />
                </div>
              </div>

              {/* Function Keys */}
              <div className="space-y-3">
                <label className="text-sm text-gray-400">Function Keys</label>
                <div className="grid grid-cols-6 md:grid-cols-12 gap-2">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((n) => (
                    <button
                      key={n}
                      onClick={() => pressKey(`f${n}`)}
                      disabled={!isConnected}
                      className="px-2 py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 rounded-lg text-sm"
                    >
                      F{n}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Apps Tab */}
          {activeTab === "apps" && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold">Application Control</h2>

              {/* Open App */}
              <div className="space-y-3">
                <label className="text-sm text-gray-400">Open Application</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={appName}
                    onChange={(e) => setAppName(e.target.value)}
                    placeholder="App name (e.g., notepad, chrome)..."
                    className="flex-1 px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500"
                    onKeyDown={(e) => e.key === "Enter" && openApp()}
                  />
                  <button
                    onClick={openApp}
                    disabled={!isConnected || !appName}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 rounded-lg"
                  >
                    <FolderOpen className="h-4 w-4" />
                    Open
                  </button>
                </div>
              </div>

              {/* Quick Launch Apps */}
              <div className="space-y-3">
                <label className="text-sm text-gray-400">Quick Launch</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { name: "Notepad", app: "notepad" },
                    { name: "Calculator", app: "calculator" },
                    { name: "Chrome", app: "chrome" },
                    { name: "Edge", app: "edge" },
                    { name: "Explorer", app: "explorer" },
                    { name: "VS Code", app: "vscode" },
                    { name: "Terminal", app: "terminal" },
                    { name: "Settings", app: "settings" },
                  ].map((item) => (
                    <button
                      key={item.app}
                      onClick={() =>
                        apiCall("/api/app/open", "POST", { name: item.app })
                      }
                      disabled={!isConnected}
                      className="p-4 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 rounded-lg text-center"
                    >
                      {item.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Open Website */}
              <div className="space-y-3">
                <label className="text-sm text-gray-400">Open Website</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={websiteUrl}
                    onChange={(e) => setWebsiteUrl(e.target.value)}
                    placeholder="URL (e.g., google.com)..."
                    className="flex-1 px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500"
                    onKeyDown={(e) => e.key === "Enter" && openWebsite()}
                  />
                  <button
                    onClick={openWebsite}
                    disabled={!isConnected || !websiteUrl}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded-lg"
                  >
                    <Globe className="h-4 w-4" />
                    Open
                  </button>
                </div>
              </div>

              {/* Quick Websites */}
              <div className="space-y-3">
                <label className="text-sm text-gray-400">Quick Websites</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    "Google",
                    "YouTube",
                    "GitHub",
                    "Gmail",
                    "Twitter",
                    "Reddit",
                    "Amazon",
                    "Netflix",
                  ].map((site) => (
                    <button
                      key={site}
                      onClick={() =>
                        apiCall("/api/browser/open", "POST", {
                          url: `${site.toLowerCase()}.com`,
                        })
                      }
                      disabled={!isConnected}
                      className="p-3 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 rounded-lg"
                    >
                      {site}
                    </button>
                  ))}
                </div>
              </div>

              {/* Window Controls */}
              <div className="space-y-3">
                <label className="text-sm text-gray-400">Window Controls</label>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  <button
                    onClick={() => apiCall("/api/window/minimize")}
                    disabled={!isConnected}
                    className="flex items-center justify-center gap-2 p-3 bg-gray-700 hover:bg-gray-600 rounded-lg"
                  >
                    <Minimize2 className="h-4 w-4" />
                    Minimize
                  </button>
                  <button
                    onClick={() => apiCall("/api/window/maximize")}
                    disabled={!isConnected}
                    className="flex items-center justify-center gap-2 p-3 bg-gray-700 hover:bg-gray-600 rounded-lg"
                  >
                    <Maximize2 className="h-4 w-4" />
                    Maximize
                  </button>
                  <button
                    onClick={() => apiCall("/api/window/close")}
                    disabled={!isConnected}
                    className="flex items-center justify-center gap-2 p-3 bg-red-600 hover:bg-red-700 rounded-lg"
                  >
                    <X className="h-4 w-4" />
                    Close
                  </button>
                  <button
                    onClick={() => apiCall("/api/window/switch")}
                    disabled={!isConnected}
                    className="flex items-center justify-center gap-2 p-3 bg-gray-700 hover:bg-gray-600 rounded-lg"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Switch
                  </button>
                  <button
                    onClick={() => apiCall("/api/window/desktop")}
                    disabled={!isConnected}
                    className="flex items-center justify-center gap-2 p-3 bg-gray-700 hover:bg-gray-600 rounded-lg"
                  >
                    <HomeIcon className="h-4 w-4" />
                    Desktop
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* System Tab */}
          {activeTab === "system" && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold">System Controls</h2>

              {/* Power Controls */}
              <div className="space-y-3">
                <label className="text-sm text-gray-400">Power</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <button
                    onClick={() => apiCall("/api/system/lock")}
                    disabled={!isConnected}
                    className="flex items-center justify-center gap-2 p-4 bg-yellow-600 hover:bg-yellow-700 rounded-lg"
                  >
                    <Lock className="h-5 w-5" />
                    Lock
                  </button>
                  <button
                    onClick={() => apiCall("/api/system/sleep")}
                    disabled={!isConnected}
                    className="flex items-center justify-center gap-2 p-4 bg-purple-600 hover:bg-purple-700 rounded-lg"
                  >
                    <Moon className="h-5 w-5" />
                    Sleep
                  </button>
                  <button
                    onClick={() => apiCall("/api/system/restart")}
                    disabled={!isConnected}
                    className="flex items-center justify-center gap-2 p-4 bg-orange-600 hover:bg-orange-700 rounded-lg"
                  >
                    <RefreshCw className="h-5 w-5" />
                    Restart
                  </button>
                  <button
                    onClick={() => apiCall("/api/system/shutdown")}
                    disabled={!isConnected}
                    className="flex items-center justify-center gap-2 p-4 bg-red-600 hover:bg-red-700 rounded-lg"
                  >
                    <Power className="h-5 w-5" />
                    Shutdown
                  </button>
                </div>
                <button
                  onClick={() => apiCall("/api/system/cancel-shutdown")}
                  disabled={!isConnected}
                  className="w-full p-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm"
                >
                  Cancel Shutdown/Restart
                </button>
              </div>

              {/* Volume Controls */}
              <div className="space-y-3">
                <label className="text-sm text-gray-400">Volume</label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={() =>
                      apiCall("/api/volume/control", "POST", { action: "down" })
                    }
                    disabled={!isConnected}
                    className="flex items-center justify-center gap-2 p-4 bg-gray-700 hover:bg-gray-600 rounded-lg"
                  >
                    <Minus className="h-5 w-5" />
                    Volume Down
                  </button>
                  <button
                    onClick={() =>
                      apiCall("/api/volume/control", "POST", { action: "mute" })
                    }
                    disabled={!isConnected}
                    className="flex items-center justify-center gap-2 p-4 bg-gray-700 hover:bg-gray-600 rounded-lg"
                  >
                    <VolumeX className="h-5 w-5" />
                    Mute
                  </button>
                  <button
                    onClick={() =>
                      apiCall("/api/volume/control", "POST", { action: "up" })
                    }
                    disabled={!isConnected}
                    className="flex items-center justify-center gap-2 p-4 bg-gray-700 hover:bg-gray-600 rounded-lg"
                  >
                    <Plus className="h-5 w-5" />
                    Volume Up
                  </button>
                </div>
              </div>

              {/* Media Controls */}
              <div className="space-y-3">
                <label className="text-sm text-gray-400">Media</label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={() => apiCall("/api/media/previous")}
                    disabled={!isConnected}
                    className="flex items-center justify-center gap-2 p-4 bg-gray-700 hover:bg-gray-600 rounded-lg"
                  >
                    <SkipBack className="h-5 w-5" />
                    Previous
                  </button>
                  <button
                    onClick={() => apiCall("/api/media/playpause")}
                    disabled={!isConnected}
                    className="flex items-center justify-center gap-2 p-4 bg-blue-600 hover:bg-blue-700 rounded-lg"
                  >
                    <Play className="h-5 w-5" />
                    Play/Pause
                  </button>
                  <button
                    onClick={() => apiCall("/api/media/next")}
                    disabled={!isConnected}
                    className="flex items-center justify-center gap-2 p-4 bg-gray-700 hover:bg-gray-600 rounded-lg"
                  >
                    <SkipForward className="h-5 w-5" />
                    Next
                  </button>
                </div>
              </div>

              {/* System Info */}
              {systemInfo && (
                <div className="space-y-3">
                  <label className="text-sm text-gray-400">System Info</label>
                  <div className="bg-gray-900 rounded-lg p-4 space-y-2 text-sm">
                    <p>
                      <span className="text-gray-400">Platform:</span>{" "}
                      {systemInfo.platform}
                    </p>
                    <p>
                      <span className="text-gray-400">Hostname:</span>{" "}
                      {systemInfo.hostname}
                    </p>
                    <p>
                      <span className="text-gray-400">Screen Size:</span>{" "}
                      {systemInfo.screen_size[0]} x {systemInfo.screen_size[1]}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Terminal Tab */}
          {activeTab === "terminal" && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold">Terminal</h2>

              <div className="space-y-3">
                <label className="text-sm text-gray-400">Run Command</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customCommand}
                    onChange={(e) => setCustomCommand(e.target.value)}
                    placeholder="Enter command..."
                    className="flex-1 px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500 font-mono"
                    onKeyDown={(e) => e.key === "Enter" && runCommand()}
                  />
                  <button
                    onClick={runCommand}
                    disabled={!isConnected || !customCommand}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 rounded-lg"
                  >
                    <Terminal className="h-4 w-4" />
                    Run
                  </button>
                </div>
              </div>

              {/* Output */}
              <div className="space-y-3">
                <label className="text-sm text-gray-400">Output</label>
                <pre className="bg-gray-900 rounded-lg p-4 min-h-[200px] max-h-[400px] overflow-auto font-mono text-sm text-green-400 whitespace-pre-wrap">
                  {commandOutput || "Command output will appear here..."}
                </pre>
              </div>

              {/* Quick Commands */}
              <div className="space-y-3">
                <label className="text-sm text-gray-400">Quick Commands</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {[
                    { label: "IP Config", cmd: "ipconfig" },
                    { label: "System Info", cmd: "systeminfo" },
                    { label: "Task List", cmd: "tasklist" },
                    { label: "Dir", cmd: "dir" },
                    { label: "Hostname", cmd: "hostname" },
                    { label: "Whoami", cmd: "whoami" },
                    { label: "Date", cmd: "date /t" },
                    { label: "Time", cmd: "time /t" },
                  ].map((item) => (
                    <button
                      key={item.cmd}
                      onClick={async () => {
                        setCustomCommand(item.cmd);
                        const data = await apiCall("/api/command/run", "POST", {
                          command: item.cmd,
                        });
                        setCommandOutput(
                          data.stdout || data.stderr || JSON.stringify(data)
                        );
                      }}
                      disabled={!isConnected}
                      className="p-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 rounded-lg text-sm font-mono"
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Stat Card Component
function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
}) {
  const colorClasses: Record<string, string> = {
    blue: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    purple: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    orange: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    green: "bg-green-500/20 text-green-400 border-green-500/30",
  };

  return (
    <div
      className={`flex items-center gap-3 p-4 rounded-lg border ${colorClasses[color]}`}
    >
      {icon}
      <div>
        <p className="text-sm opacity-80">{label}</p>
        <p className="text-lg font-semibold">{value}</p>
      </div>
    </div>
  );
}

// Shortcut Button Component
function ShortcutButton({
  icon,
  label,
  onClick,
  disabled,
}: {
  icon?: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex items-center justify-center gap-2 p-3 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:cursor-not-allowed rounded-lg transition-colors"
    >
      {icon}
      {label}
    </button>
  );
}
