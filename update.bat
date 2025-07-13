@echo off
cd /d "D:\Hasan-Here-Exam-Portal"

:: Pull latest from gemini branch
echo Pulling latest from 'gemini' branch...
git pull origin gemini > git_output.txt

:: Check if repo is already up to date
findstr /C:"Already up to date." git_output.txt >nul
IF %ERRORLEVEL%==0 (
    echo ✅ Already up to date. No build needed.
) ELSE (
    echo 🔄 New updates pulled. Rebuilding the project...

    :: Delete .next if it exists
    IF EXIST ".next" (
        echo Deleting old .next folder...
        rmdir /s /q ".next"
    )

    :: Run Next.js build
    echo Running npm run build...
    call npm run build
)

:: Clean up
del git_output.txt

pause
