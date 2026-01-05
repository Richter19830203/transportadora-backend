@echo off
setlocal
set VENV=C:\Users\NOTE\Desktop\Aula\.venv
cd /d "%~dp0"

"%VENV%\Scripts\pip.exe" install pyinstaller==6.17.0
"%VENV%\Scripts\pip.exe" install pandas openpyxl
"%VENV%\Scripts\python.exe" -m PyInstaller --noconfirm --onefile --name TransportadoraControle --add-data "templates;templates" --add-data "static;static" controle.py

if %ERRORLEVEL% NEQ 0 (
  echo Build failed.
  pause
  exit /b 1
)

echo Build complete.
echo Executable: %~dp0dist\TransportadoraControle.exe
pause
