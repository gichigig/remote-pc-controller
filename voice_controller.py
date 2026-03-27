"""
Voice-Controlled PC Bot
-----------------------
Control your PC using voice commands.
Commands: open apps, close tabs, type text, send messages, and more.
"""

import speech_recognition as sr
import pyttsx3
import pyautogui
import subprocess
import os
import time
import webbrowser
import psutil

# Initialize text-to-speech engine
engine = pyttsx3.init()
engine.setProperty('rate', 150)
engine.setProperty('volume', 1.0)

# Initialize speech recognizer
recognizer = sr.Recognizer()

# Application paths (customize these for your system)
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
    'word': r'C:\Program Files\Microsoft Office\root\Office16\WINWORD.EXE',
    'excel': r'C:\Program Files\Microsoft Office\root\Office16\EXCEL.EXE',
    'powerpoint': r'C:\Program Files\Microsoft Office\root\Office16\POWERPNT.EXE',
    'spotify': r'C:\Users\%USERNAME%\AppData\Roaming\Spotify\Spotify.exe',
    'discord': r'C:\Users\%USERNAME%\AppData\Local\Discord\Update.exe --processStart Discord.exe',
    'vscode': r'C:\Users\%USERNAME%\AppData\Local\Programs\Microsoft VS Code\Code.exe',
}

# Website shortcuts
WEBSITES = {
    'youtube': 'https://www.youtube.com',
    'google': 'https://www.google.com',
    'github': 'https://www.github.com',
    'gmail': 'https://mail.google.com',
    'facebook': 'https://www.facebook.com',
    'twitter': 'https://www.twitter.com',
    'reddit': 'https://www.reddit.com',
    'amazon': 'https://www.amazon.com',
}


def speak(text):
    """Convert text to speech."""
    print(f"Assistant: {text}")
    engine.say(text)
    engine.runAndWait()


def listen():
    """Listen for voice commands and return the recognized text."""
    with sr.Microphone() as source:
        print("\n🎤 Listening...")
        recognizer.adjust_for_ambient_noise(source, duration=0.5)
        try:
            audio = recognizer.listen(source, timeout=5, phrase_time_limit=10)
            print("🔄 Processing...")
            command = recognizer.recognize_google(audio).lower()
            print(f"You said: {command}")
            return command
        except sr.WaitTimeoutError:
            return ""
        except sr.UnknownValueError:
            print("Could not understand audio")
            return ""
        except sr.RequestError as e:
            print(f"Could not request results; {e}")
            return ""


def open_application(app_name):
    """Open an application by name."""
    app_name = app_name.lower().strip()
    
    # Check if it's a known application
    if app_name in APP_PATHS:
        try:
            path = os.path.expandvars(APP_PATHS[app_name])
            subprocess.Popen(path, shell=True)
            speak(f"Opening {app_name}")
            return True
        except Exception as e:
            speak(f"Could not open {app_name}")
            print(f"Error: {e}")
            return False
    
    # Try to open using Windows start command
    try:
        subprocess.Popen(f'start {app_name}', shell=True)
        speak(f"Opening {app_name}")
        return True
    except Exception as e:
        speak(f"Could not find {app_name}")
        print(f"Error: {e}")
        return False


def open_website(site_name):
    """Open a website in the default browser."""
    site_name = site_name.lower().strip()
    
    if site_name in WEBSITES:
        url = WEBSITES[site_name]
    elif site_name.startswith('http'):
        url = site_name
    else:
        url = f"https://www.{site_name}.com"
    
    webbrowser.open(url)
    speak(f"Opening {site_name}")


def close_current_tab():
    """Close the current browser tab."""
    pyautogui.hotkey('ctrl', 'w')
    speak("Closing tab")


def close_current_window():
    """Close the current window."""
    pyautogui.hotkey('alt', 'F4')
    speak("Closing window")


def close_application(app_name):
    """Close an application by name."""
    app_name = app_name.lower().strip()
    
    for proc in psutil.process_iter(['name']):
        try:
            if app_name in proc.info['name'].lower():
                proc.terminate()
                speak(f"Closing {app_name}")
                return True
        except (psutil.NoSuchProcess, psutil.AccessDenied):
            pass
    
    speak(f"Could not find {app_name} running")
    return False


def type_text(text):
    """Type the specified text."""
    pyautogui.typewrite(text, interval=0.02)
    speak("Done typing")


def type_text_unicode(text):
    """Type text with Unicode support (for special characters)."""
    pyautogui.write(text)
    speak("Done typing")


def press_key(key):
    """Press a specific key."""
    key_mapping = {
        'enter': 'enter',
        'return': 'enter',
        'tab': 'tab',
        'space': 'space',
        'backspace': 'backspace',
        'delete': 'delete',
        'escape': 'escape',
        'up': 'up',
        'down': 'down',
        'left': 'left',
        'right': 'right',
        'home': 'home',
        'end': 'end',
    }
    
    key = key.lower().strip()
    if key in key_mapping:
        pyautogui.press(key_mapping[key])
        speak(f"Pressed {key}")
    else:
        pyautogui.press(key)
        speak(f"Pressed {key}")


def send_message():
    """Send a message (press Enter)."""
    pyautogui.press('enter')
    speak("Message sent")


def copy_text():
    """Copy selected text."""
    pyautogui.hotkey('ctrl', 'c')
    speak("Copied")


def paste_text():
    """Paste from clipboard."""
    pyautogui.hotkey('ctrl', 'v')
    speak("Pasted")


def cut_text():
    """Cut selected text."""
    pyautogui.hotkey('ctrl', 'x')
    speak("Cut")


def undo():
    """Undo last action."""
    pyautogui.hotkey('ctrl', 'z')
    speak("Undone")


def redo():
    """Redo last action."""
    pyautogui.hotkey('ctrl', 'y')
    speak("Redone")


def select_all():
    """Select all text."""
    pyautogui.hotkey('ctrl', 'a')
    speak("Selected all")


def save_file():
    """Save current file."""
    pyautogui.hotkey('ctrl', 's')
    speak("Saved")


def new_tab():
    """Open a new tab."""
    pyautogui.hotkey('ctrl', 't')
    speak("New tab opened")


def switch_tab():
    """Switch to next tab."""
    pyautogui.hotkey('ctrl', 'tab')
    speak("Switched tab")


def switch_window():
    """Switch between windows."""
    pyautogui.hotkey('alt', 'tab')
    speak("Switched window")


def minimize_window():
    """Minimize current window."""
    pyautogui.hotkey('win', 'down')
    speak("Window minimized")


def maximize_window():
    """Maximize current window."""
    pyautogui.hotkey('win', 'up')
    speak("Window maximized")


def show_desktop():
    """Show desktop."""
    pyautogui.hotkey('win', 'd')
    speak("Showing desktop")


def take_screenshot():
    """Take a screenshot."""
    pyautogui.hotkey('win', 'shift', 's')
    speak("Screenshot tool opened")


def lock_computer():
    """Lock the computer."""
    pyautogui.hotkey('win', 'l')
    speak("Locking computer")


def search_windows(query):
    """Search in Windows."""
    pyautogui.hotkey('win')
    time.sleep(0.5)
    pyautogui.typewrite(query, interval=0.02)
    speak(f"Searching for {query}")


def volume_up():
    """Increase volume."""
    pyautogui.press('volumeup')
    speak("Volume up")


def volume_down():
    """Decrease volume."""
    pyautogui.press('volumedown')
    speak("Volume down")


def mute():
    """Mute/unmute volume."""
    pyautogui.press('volumemute')
    speak("Toggled mute")


def play_pause():
    """Play/pause media."""
    pyautogui.press('playpause')
    speak("Toggled play pause")


def next_track():
    """Next media track."""
    pyautogui.press('nexttrack')
    speak("Next track")


def previous_track():
    """Previous media track."""
    pyautogui.press('prevtrack')
    speak("Previous track")


def scroll_down():
    """Scroll down."""
    pyautogui.scroll(-5)
    speak("Scrolled down")


def scroll_up():
    """Scroll up."""
    pyautogui.scroll(5)
    speak("Scrolled up")


def refresh_page():
    """Refresh current page."""
    pyautogui.hotkey('ctrl', 'r')
    speak("Refreshing")


def go_back():
    """Go back in browser."""
    pyautogui.hotkey('alt', 'left')
    speak("Going back")


def go_forward():
    """Go forward in browser."""
    pyautogui.hotkey('alt', 'right')
    speak("Going forward")


def process_command(command):
    """Process and execute voice commands."""
    if not command:
        return True
    
    # Exit commands
    if any(word in command for word in ['exit', 'quit', 'stop listening', 'goodbye', 'bye']):
        speak("Goodbye!")
        return False
    
    # Open applications
    if 'open' in command:
        # Check for websites first
        for site in WEBSITES:
            if site in command:
                open_website(site)
                return True
        
        # Check for applications
        for app in APP_PATHS:
            if app in command:
                open_application(app)
                return True
        
        # Generic open - extract app name
        if 'open' in command:
            parts = command.split('open')
            if len(parts) > 1:
                app_name = parts[1].strip()
                if app_name:
                    open_application(app_name)
                return True
    
    # Close commands
    if 'close tab' in command:
        close_current_tab()
        return True
    
    if 'close window' in command:
        close_current_window()
        return True
    
    if 'close' in command:
        # Extract app name
        parts = command.split('close')
        if len(parts) > 1:
            app_name = parts[1].strip()
            if app_name:
                close_application(app_name)
        return True
    
    # Type commands
    if command.startswith('type '):
        text = command[5:]  # Remove 'type ' prefix
        type_text_unicode(text)
        return True
    
    if command.startswith('write '):
        text = command[6:]  # Remove 'write ' prefix
        type_text_unicode(text)
        return True
    
    # Send message
    if 'send' in command or 'enter' in command:
        send_message()
        return True
    
    # Clipboard operations
    if 'copy' in command:
        copy_text()
        return True
    
    if 'paste' in command:
        paste_text()
        return True
    
    if 'cut' in command:
        cut_text()
        return True
    
    # Edit operations
    if 'undo' in command:
        undo()
        return True
    
    if 'redo' in command:
        redo()
        return True
    
    if 'select all' in command:
        select_all()
        return True
    
    if 'save' in command:
        save_file()
        return True
    
    # Tab and window management
    if 'new tab' in command:
        new_tab()
        return True
    
    if 'switch tab' in command or 'next tab' in command:
        switch_tab()
        return True
    
    if 'switch window' in command or 'alt tab' in command:
        switch_window()
        return True
    
    if 'minimize' in command:
        minimize_window()
        return True
    
    if 'maximize' in command:
        maximize_window()
        return True
    
    if 'desktop' in command or 'show desktop' in command:
        show_desktop()
        return True
    
    # Screenshot
    if 'screenshot' in command or 'screen shot' in command:
        take_screenshot()
        return True
    
    # Lock computer
    if 'lock' in command:
        lock_computer()
        return True
    
    # Search
    if 'search' in command:
        parts = command.split('search')
        if len(parts) > 1:
            query = parts[1].strip().replace('for', '').strip()
            if query:
                search_windows(query)
        return True
    
    # Volume controls
    if 'volume up' in command or 'louder' in command:
        for _ in range(3):
            volume_up()
        return True
    
    if 'volume down' in command or 'quieter' in command:
        for _ in range(3):
            volume_down()
        return True
    
    if 'mute' in command:
        mute()
        return True
    
    # Media controls
    if 'play' in command or 'pause' in command:
        play_pause()
        return True
    
    if 'next track' in command or 'next song' in command:
        next_track()
        return True
    
    if 'previous track' in command or 'previous song' in command:
        previous_track()
        return True
    
    # Scroll
    if 'scroll down' in command:
        scroll_down()
        return True
    
    if 'scroll up' in command:
        scroll_up()
        return True
    
    # Browser navigation
    if 'refresh' in command or 'reload' in command:
        refresh_page()
        return True
    
    if 'go back' in command:
        go_back()
        return True
    
    if 'go forward' in command:
        go_forward()
        return True
    
    # Press specific keys
    if 'press' in command:
        parts = command.split('press')
        if len(parts) > 1:
            key = parts[1].strip()
            if key:
                press_key(key)
        return True
    
    # Go to website
    if 'go to' in command or 'visit' in command:
        parts = command.replace('go to', '').replace('visit', '').strip()
        if parts:
            open_website(parts)
        return True
    
    # Help command
    if 'help' in command:
        show_help()
        return True
    
    speak("I didn't understand that command. Say 'help' for available commands.")
    return True


def show_help():
    """Display available commands."""
    help_text = """
    Available Commands:
    
    🚀 OPEN APPS:
       "open chrome", "open notepad", "open calculator"
    
    🌐 WEBSITES:
       "open youtube", "go to google", "visit github"
    
    ❌ CLOSE:
       "close tab", "close window", "close chrome"
    
    ⌨️ TYPING:
       "type hello world", "write your message"
    
    📤 SEND:
       "send", "enter", "send message"
    
    📋 CLIPBOARD:
       "copy", "paste", "cut"
    
    ✏️ EDITING:
       "undo", "redo", "select all", "save"
    
    🪟 WINDOWS:
       "new tab", "switch tab", "switch window"
       "minimize", "maximize", "show desktop"
    
    📸 SYSTEM:
       "screenshot", "lock", "search for..."
    
    🔊 VOLUME:
       "volume up", "volume down", "mute"
    
    🎵 MEDIA:
       "play", "pause", "next track", "previous track"
    
    📜 SCROLL:
       "scroll up", "scroll down"
    
    🔙 NAVIGATION:
       "go back", "go forward", "refresh"
    
    ⏹️ EXIT:
       "exit", "quit", "goodbye"
    """
    print(help_text)
    speak("Here are the available commands. Check the console for the full list.")


def main():
    """Main function to run the voice controller."""
    print("=" * 50)
    print("   🎤 Voice-Controlled PC Bot 🎤")
    print("=" * 50)
    print("\nInitializing... Please wait.")
    
    speak("Voice controller is ready. Say a command or say help for available commands.")
    
    running = True
    while running:
        try:
            command = listen()
            running = process_command(command)
        except KeyboardInterrupt:
            speak("Goodbye!")
            break
        except Exception as e:
            print(f"Error: {e}")
            continue
    
    print("\nVoice controller stopped.")


if __name__ == "__main__":
    main()
