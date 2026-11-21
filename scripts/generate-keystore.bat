@echo off
echo ========================================================
echo  Generating Production Release Keystore for Google Play
echo ========================================================
echo.

cd /d "%~dp0\..\client\android\app"

keytool -genkey -v -keystore auraalarm-release.keystore -alias auraalarm -keyalg RSA -keysize 2048 -validity 10000

echo.
echo Keystore created at client\android\app\auraalarm-release.keystore
echo Keep this keystore and password secure! It is required for all Google Play Store updates.
pause
