@echo off
title Building AuraAlarm Free Android APK
echo ========================================================
echo   AuraAlarm Native Android APK Builder
echo ========================================================
echo.

echo [1/2] Building Web Production Assets...
cd /d "%~dp0client"
call npm run build

echo.
echo [2/2] Syncing Capacitor Native Assets...
call npx cap sync android

echo.
echo ========================================================
echo  Opening project in Android Studio...
echo.
echo  In Android Studio:
echo  1. Click: Build > Build Bundle(s) / APK(s) > Build APK(s)
echo  2. Click the "locate" link when prompted to get your .apk!
echo ========================================================
echo.
call npx cap open android
pause
