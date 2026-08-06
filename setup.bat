@echo off
echo ==============================================
echo           VerQ 2.0 Environment Setup          
echo ==============================================
echo.

if not exist "backend\.env" (
    echo Copying backend\.env.example to backend\.env...
    copy "backend\.env.example" "backend\.env"
) else (
    echo backend\.env already exists.
)

if not exist "frontend\.env" (
    echo Copying frontend\.env.example to frontend\.env...
    copy "frontend\.env.example" "frontend\.env"
) else (
    echo frontend\.env already exists.
)

echo.
echo ==============================================
echo Setup completed! Please configure your
echo GEMINI_API_KEY and DEEPGRAM_API_KEY in backend/.env.
echo ==============================================
echo.
pause
