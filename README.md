# Scholar's Journal — PWA

A Progressive Web App for tracking weekly homeschool tasks.

## Quick Start

### macOS / Linux
```bash
./serve.sh
```

### Windows
```
serve.bat
```

Then open **http://localhost:8080** in your browser.

## Install to Device

After opening the URL once while connected:

| Platform | How to Install |
|----------|---------------|
| **iOS** | Safari → Share → "Add to Home Screen" |
| **Android** | Chrome → ⋮ Menu → "Install app" |
| **Desktop** | Chrome → click install icon in URL bar |

## Fully Offline

After the first load, the app works completely offline — no server needed. All task progress is saved in the browser's local storage on the device.

## Serving on Your Network

To access from another device (like an iPad), make sure both devices are on the same WiFi, then open the URL shown in the terminal (your computer's local IP).

## File Structure
```
├── index.html      ← The full app (React bundled inline)
├── manifest.json   ← PWA manifest
├── sw.js           ← Service worker (enables offline)
├── icons/
│   ├── icon-192.png
│   └── icon-512.png
├── serve.sh        ← Start server (macOS/Linux)
├── serve.bat       ← Start server (Windows)
└── README.md
```
