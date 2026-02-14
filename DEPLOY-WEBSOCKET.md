# Déployer le serveur WebSocket sur Railway

Ce guide explique comment créer un **second service Railway** pour le serveur WebSocket multijoueur (`server/index.ts`), en plus du bot Telegram.

---

## 1. Architecture cible

| Service        | Rôle                    | Commande de démarrage | URL publique |
|----------------|-------------------------|------------------------|--------------|
| **royale-dames** (bot)   | Bot Telegram            | `npm start`            | Non exposée  |
| **royale-dames-ws** (nouveau) | Serveur WebSocket Socket.IO | `npm run server` | `https://xxx.up.railway.app` |

Les deux services utilisent le **même dépôt Git** et le **même Dockerfile**, seul le **Start Command** et les **variables d’environnement** diffèrent.

---

## 2. Créer le service WebSocket dans Railway

### Étape 1 : Nouveau service depuis le même repo

1. Va sur [railway.app](https://railway.app) et ouvre ton projet **hot game dame**.
2. Clique sur **+ New** → **GitHub Repo**.
3. Sélectionne le **même dépôt** que le bot (`ulrukpusha-cpu/royale-dames`).
4. Railway crée un nouveau service (ex. **royale-dames-ws**).

### Étape 2 : Configurer le service

1. Clique sur le nouveau service.
2. Va dans **Settings** (Paramètres).

#### Root Directory
- Laisse **vide** ou mets `.` (racine du dépôt).

#### Build
- **Builder** : Dockerfile (détecté automatiquement).
- Pas de changement nécessaire si le Dockerfile est à la racine.

#### Deploy → Start Command
- Remplace `npm start` par :  
  **`npm run server`**

C’est la seule différence avec le service du bot.

### Étape 3 : Exposer le service (domaine public)

Le serveur WebSocket doit être accessible depuis le frontend (Vercel).

1. Dans le service WebSocket, va dans **Settings** → **Networking** (Mise en réseau).
2. Clique sur **Generate Domain** (Générer un domaine).
3. Note l’URL générée, par ex. :  
   `https://royale-dames-ws-production-xxxx.up.railway.app`

### Étape 4 : Variables d'environnement

Dans **Variables** du service WebSocket, ajoute :

| Variable        | Valeur                                                | Description                            |
|-----------------|--------------------------------------------------------|----------------------------------------|
| `CLIENT_URL`    | `https://royale-dames.vercel.app`                      | URL du frontend (CORS). Remplace par ton URL Vercel réelle. |
| `PORT`          | `3001`                                                | Optionnel. Railway définit `PORT` automatiquement. |

---

## 3. Configurer le frontend (Vercel)

1. Va sur [vercel.com](https://vercel.com) → ton projet Royale Dames.
2. **Settings** → **Environment Variables**.
3. Ajoute :

| Name           | Value                                              | Environments   |
|----------------|----------------------------------------------------|----------------|
| `VITE_WS_URL`  | `https://royale-dames-ws-production-xxxx.up.railway.app` | Production, Preview |

Remplace par l’URL exacte du service WebSocket Railway (sans `/` à la fin).

4. Redéploie le frontend (Deployments → ... → Redeploy) pour prendre en compte la nouvelle variable.

---

## 4. Vérification

### Logs du service WebSocket

1. Railway → service WebSocket → **Deployments** → dernier déploiement → **Deploy Logs**.
2. Tu dois voir :  
   `🎮 Serveur Royale Dames WebSocket sur le port XXXX`

### Test depuis le frontend

1. Ouvre ton app Vercel.
2. Connecte-toi.
3. Lance une partie en mode **En ligne** ou **Inviter un ami**.
4. Le frontend doit se connecter au WebSocket sans erreur.

---

## 5. Résumé des commandes

### Service 1 – Bot Telegram
- **Start Command** : `npm start`
- **Variables** : `TELEGRAM_BOT_TOKEN`, `WEB_APP_URL`
- **Domaine** : non nécessaire

### Service 2 – Serveur WebSocket
- **Start Command** : `npm run server`
- **Variables** : `CLIENT_URL`
- **Domaine** : générer un domaine public

---

## 6. Dépannage

### Le service crash au démarrage
- Vérifie les **Deploy Logs**.
- Assure-toi que `CLIENT_URL` pointe bien vers ton frontend Vercel.

### Erreurs CORS
- Vérifie que `CLIENT_URL` correspond exactement à l’URL du frontend (sans slash final).
- Si tu utilises plusieurs domaines (preview, production), tu peux mettre plusieurs origines séparées par une virgule (selon la config CORS du serveur).

### Le frontend ne se connecte pas
- Vérifie que `VITE_WS_URL` est défini sur Vercel.
- Redéploie le frontend après l’ajout de la variable.
- Ouvre la console du navigateur pour voir les erreurs de connexion WebSocket.
