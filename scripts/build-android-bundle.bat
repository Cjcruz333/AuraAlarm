@echo off
echo ========================================================
echo  Building Android App Bundle (.aab) for Google Play
echo ========================================================
echo.

cd /d "%~dp0\..\client"
call npm run build
call npx cap sync android

cd android
call gradlew.bat bundleRelease

echo.
echo ========================================================
echo  Build complete!
echo  Your Google Play bundle is at:
echo  client\android\app\build\outputs\bundle\release\app-release.aab
echo ========================================================
pause
