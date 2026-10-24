@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo Mise a jour des annonces depuis akorimmo.com...
node agent\build.mjs
if errorlevel 1 (
  echo.
  echo Echec : Node.js est-il installe ? https://nodejs.org
) else (
  echo.
  echo Termine. Le dossier "public" est pret a etre depose sur Netlify.
)
pause
