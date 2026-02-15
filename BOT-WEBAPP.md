# Intégration Bot Telegram ↔ WebApp Royale Dames

## Architecture

Le bot Telegram est désormais **intégré au serveur WebSocket**. Quand tu lances `npm run server`, le serveur démarre ET le bot.

## Flux des alertes

1. **Utilisateur A** ouvre la webapp, met sa mise à 5$, clique sur **En ligne**
2. La webapp émet `game:search` au serveur WebSocket
3. Le serveur appelle `broadcastMatchSearch(5, 'USD', username)`
4. **Tous les utilisateurs** ayant fait `/start` au bot reçoivent :

   > 🎮 **Partie en ligne disponible !**
   >
   > Un joueur cherche un adversaire • Mise : **5 $**
   >
   > Rejoins vite pour ne pas le rater ! 👇
   >
   > [🎲 Rejoindre la partie]

## Stockage des destinataires

- Les **chat IDs** sont sauvegardés dans `chat-ids.json` à chaque `/start`
- Ce fichier est ignoré par Git (données utilisateurs)
- Sur Railway, le fichier est recréé à chaque déploiement (stockage éphémère)

## Variables d'environnement

| Variable | Description |
|----------|-------------|
| `TELEGRAM_BOT_TOKEN` | Token du bot (BotFather) |
| `WEB_APP_URL` | URL de la webapp (ex: https://royale-dames.vercel.app) |

## Commandes utiles

```bash
# Lancer le serveur + bot en local
npm run server

# Ou en dev avec rechargement
npm run server:dev
```

## Déploiement Railway

Le service WebSocket (`railway-websocket.toml`) exécute `npm run server`. Assure-toi que `TELEGRAM_BOT_TOKEN` et `WEB_APP_URL` sont définis dans les variables d'environnement Railway.

## Personnaliser le message

Le message est défini dans `server/telegramBot.ts`, fonction `broadcastMatchSearch`.
