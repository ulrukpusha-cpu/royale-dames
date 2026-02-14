# Script de push - Royale Dames
# Execute: .\push.ps1
# ou: powershell -ExecutionPolicy Bypass -File .\push.ps1

git add .
git status
git commit -m "Update: onglet Amis, mode invité amélioré, Portefeuille Telegram, Jouer vs IA"
git push origin main
