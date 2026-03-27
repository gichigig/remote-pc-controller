# 🎤 Voice-Controlled PC Bot

Control your PC using voice commands! Open apps, close tabs, type text, and more.

## 📦 Installation

### 1. Install Python dependencies

```bash
pip install -r requirements.txt
```

### 2. Install PyAudio (if you get errors)

PyAudio can be tricky to install. Try these methods:

**Option A - Using pipwin (easiest):**
```bash
pip install pipwin
pipwin install pyaudio
```

**Option B - Download wheel file:**
1. Go to https://www.lfd.uci.edu/~gohlke/pythonlibs/#pyaudio
2. Download the wheel matching your Python version
3. Run: `pip install PyAudio-0.2.14-cp311-cp311-win_amd64.whl`

## 🚀 Running the Bot

```bash
python voice_controller.py
```

## 🗣️ Voice Commands

### Opening Apps
- "open chrome"
- "open notepad"
- "open calculator"
- "open spotify"
- "open vscode"

### Opening Websites
- "open youtube"
- "go to google"
- "visit github"
- "open gmail"

### Closing Things
- "close tab" - closes current browser tab
- "close window" - closes current window
- "close chrome" - closes Chrome application

### Typing & Sending
- "type hello world" - types "hello world"
- "write your message here" - types text
- "send" or "enter" - presses Enter key

### Clipboard Operations
- "copy" - Ctrl+C
- "paste" - Ctrl+V
- "cut" - Ctrl+X

### Editing
- "undo" - Ctrl+Z
- "redo" - Ctrl+Y
- "select all" - Ctrl+A
- "save" - Ctrl+S

### Window Management
- "new tab" - opens new browser tab
- "switch tab" - next tab
- "switch window" - Alt+Tab
- "minimize" - minimize window
- "maximize" - maximize window
- "show desktop" - Win+D

### System Controls
- "screenshot" - opens snipping tool
- "lock" - locks computer
- "search for notepad" - Windows search

### Volume & Media
- "volume up" / "louder"
- "volume down" / "quieter"
- "mute"
- "play" / "pause"
- "next track"
- "previous track"

### Navigation
- "scroll up"
- "scroll down"
- "go back"
- "go forward"
- "refresh"

### Exit
- "exit" / "quit" / "goodbye"

## ⚙️ Customization

### Adding New Applications

Edit the `APP_PATHS` dictionary in `voice_controller.py`:

```python
APP_PATHS = {
    'myapp': r'C:\Path\To\MyApp.exe',
    # Add more apps here
}
```

### Adding New Websites

Edit the `WEBSITES` dictionary:

```python
WEBSITES = {
    'mysite': 'https://www.mysite.com',
    # Add more sites here
}
```

## 🔧 Troubleshooting

### Microphone not working
1. Check Windows microphone permissions
2. Ensure microphone is set as default input device
3. Test microphone in Windows settings

### Speech not recognized
- Speak clearly and at a moderate pace
- Reduce background noise
- Try adjusting the microphone sensitivity

### Application paths not found
- Update the paths in `APP_PATHS` to match your system
- Use full paths for applications not in system PATH

## 📝 Notes

- The bot uses Google's speech recognition (requires internet)
- Some commands may need adjustment based on your Windows version
- Press Ctrl+C to force stop the bot

## 🔒 Security

This bot can control your PC, so:
- Don't run it on shared/public computers
- Be careful with voice commands in public spaces
- Close the bot when not in use
