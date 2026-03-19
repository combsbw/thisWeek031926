#!/bin/bash
PORT=${1:-8080}
echo ""
echo "  ✦  Scholar's Journal PWA  ✦"
echo ""
echo "  Serving at: http://localhost:$PORT"
echo "  Open this URL on any device on your network:"
echo "  http://$(hostname -I 2>/dev/null | awk '{print $1}' || echo 'your-ip'):$PORT"
echo ""
echo "  To install as an app:"
echo "    iOS:     Open in Safari → Share → Add to Home Screen"
echo "    Android: Open in Chrome → Menu → Install app"
echo "    Desktop: Chrome → URL bar install icon (or Menu → Install)"
echo ""
echo "  Press Ctrl+C to stop."
echo ""
cd "$(dirname "$0")"
python3 -m http.server $PORT
