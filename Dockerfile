# Railway - Bot Telegram Royale Dames
FROM node:20-alpine

WORKDIR /app

# Copier les fichiers de dépendances
COPY package.json package-lock.json* ./

# Installer les dépendances
RUN npm install --omit=dev

# Copier le reste du projet
COPY . .

# Démarrer le serveur WebSocket + Bot Telegram (alertes parties en ligne)
CMD ["npm", "run", "server"]
