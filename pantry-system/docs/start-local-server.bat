@echo off
echo Starting local web server for Firebase testing...
echo.
echo Access your site at: http://localhost:8000
echo Firebase test page: http://localhost:8000/firebase-test.html
echo Admin page: http://localhost:8000/admin.html
echo.
echo Press Ctrl+C to stop the server
echo.

cd /d "%~dp0"

REM Try Python 3 first, then Python 2
python -m http.server 8000 2>nul || python -m SimpleHTTPServer 8000