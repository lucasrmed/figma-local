@echo off
setlocal DisableDelayedExpansion
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Instale o Node.js LTS 22 ou posterior em https://nodejs.org/en/download
  echo Depois reabra este instalador.
  pause
  exit /b 1
)
node scripts/install.mjs --open
if errorlevel 1 (
  echo A instalacao nao terminou. Confira a mensagem acima.
  pause
  exit /b 1
)
echo Leitor e skills instalados. Siga o guia que abriu no navegador.
pause
