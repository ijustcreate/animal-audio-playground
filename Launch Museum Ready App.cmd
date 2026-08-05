@echo off
setlocal

cd /d "%~dp0"

set "ELECTRON_EXE=%~dp0node_modules\electron\dist\electron.exe"

if not exist "%ELECTRON_EXE%" (
  echo The Museum Ready App launcher could not find Electron.
  echo Run npm install in this folder first, then launch again.
  pause
  exit /b 1
)

start "" "%ELECTRON_EXE%" "."
exit /b 0
