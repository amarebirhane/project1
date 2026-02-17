@echo off
echo ==========================================
echo   Financial System Backend Startup
echo ==========================================
echo.
echo Activating virtual environment...
call venv\Scripts\activate
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Failed to activate virtual environment.
    echo Please ensure 'venv' exists in the backend directory.
    pause
    exit /b %ERRORLEVEL%
)

echo Starting backend server on http://localhost:8000...
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
