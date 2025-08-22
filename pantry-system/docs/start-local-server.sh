#!/bin/bash

echo "Starting local web server for Firebase testing..."
echo ""
echo "Access your site at: http://localhost:8000"
echo "Firebase test page: http://localhost:8000/firebase-test.html"
echo "Admin page: http://localhost:8000/admin.html"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

# Try Python 3 first, then Python 2
if command -v python3 &> /dev/null; then
    python3 -m http.server 8000
elif command -v python &> /dev/null; then
    python -m http.server 8000
else
    echo "Python not found. Please install Python to run the local server."
    exit 1
fi