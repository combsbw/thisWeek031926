@echo off
echo.
echo   Scholar's Journal PWA
echo.
echo   Serving at: http://localhost:8080
echo   To install: open in Chrome and click the install icon in the URL bar.
echo   Press Ctrl+C to stop.
echo.
cd /d "%~dp0"
python -m http.server 8080
