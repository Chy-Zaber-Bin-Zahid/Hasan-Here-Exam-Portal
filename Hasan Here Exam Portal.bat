@echo off
cd /d "D:\Hasan-Here-Exam-Portal"

:: Check if .next/BUILD_ID exists to determine if build is done
IF NOT EXIST ".next\BUILD_ID" (
    echo No Next.js build found. Running build...
    call npm run build
) ELSE (
    echo Build already exists. Skipping build step.
)

:: Start Electron
call npm run electron:dev