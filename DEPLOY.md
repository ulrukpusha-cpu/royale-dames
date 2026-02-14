# Déploiement Royale Dames — Vercel & Railway

Ce guide décrit comment déployer la **web app** sur **Vercel** et le **bot Telegram** sur **Railway**.

---

## 1. Prérequis

- Un compte [Vercel](https://vercel.com) et [Railway](https://railway.app)
- Un dépôt Git (GitHub, GitLab ou Bitbucket) avec le code du projet
- Un bot Telegram créé via [@BotFather](https://t.me/BotFather) (pour le token)

---

## 2. Déployer la web app sur Vercel

### 2.1 Importer le projet

1. Va sur [vercel.com](https://vercel.com) et connecte-toi.
2. **Add New** → **Project**.
3. Importe le dépôt Git du projet (ex. GitHub).
4. Vercel détecte automatiquement **Vite** grâce à `vercel.json` et `vite.config.ts`.

### 2.2 Configuration du build

Vercel utilise par défaut :

| Option            | Valeur           |
|-------------------|------------------|
| **Framework Preset** | Vite (auto)    |
| **Build Command**   | `npm run build` |
| **Output Directory**| `dist`          |
| **Install Command** | `npm install`   |

Tu peux laisser ces valeurs (elles sont aussi définies dans `vercel.json`).

### 2.3 Variables d’environnement (optionnel)

Si tu utilises des variables côté build (ex. `GEMINI_API_KEY` dans `vite.config.ts`) :

- **Project** → **Settings** → **Environment Variables**
- Ajoute `GEMINI_API_KEY` (et autres) pour les environnements **Production**, **Preview**, etc.

### 2.4 Déploiement

- Clique sur **Deploy**.
- Une fois le déploiement terminé, note l’URL de production, par ex. :  
  `https://royale-dames-xxx.vercel.app`

Cette URL servira de **WEB_APP_URL** pour le bot sur Railway.

---

## 3. Déployer le bot Telegram sur Railway

### 3.1 Créer un projet et un service

1. Va sur [railway.app](https://railway.app) et connecte-toi.
2. **New Project** → **Deploy from GitHub repo** (ou **Empty Project** si tu déploies au CLI).
3. Choisis le **même dépôt** que pour Vercel.
4. Railway crée un **service** et détecte un projet Node.js.

### 3.2 Configurer le service pour le bot

Le bot est lancé avec `npm start` (voir `package.json` et `railway.toml`).

- **Build Command** : tu peux laisser le défaut (ex. `npm install`).
- **Start Command** : doit être `npm start` (défini dans `railway.toml` ; sinon configure-le dans **Settings** → **Deploy** → **Start Command**).

### 3.3 Variables d’environnement

Dans le service Railway :

1. **Variables** (ou **Settings** → **Variables**).
2. Ajoute :

| Variable              | Valeur                                      | Description                          |
|-----------------------|---------------------------------------------|--------------------------------------|
| `TELEGRAM_BOT_TOKEN`  | Ton token du bot (depuis @BotFather)        | Obligatoire pour que le bot fonctionne. |
| `WEB_APP_URL`         | `https://ton-app.vercel.app`                 | URL de la web app (Vercel) pour les liens d’invitation. |

Remplace `https://ton-app.vercel.app` par l’URL réelle de ton déploiement Vercel.

### 3.4 Déploiement

- À chaque push sur la branche liée, Railway redéploie.
- Tu peux aussi lancer un déploiement manuel depuis le dashboard ou avec la CLI :  
  `railway up`

Le bot tourne en **polling** : pas besoin d’exposer d’URL publique pour le bot sur Railway.

---

## 4. Vérifications après déploiement

### Web app (Vercel)

- Ouvre l’URL Vercel : la page de login Royale Dames s’affiche.
- Teste une partie (solo, local, etc.).

### Bot Telegram (Railway)

- Ouvre une conversation avec ton bot sur Telegram.
- Envoie `/start` : tu dois voir le message de bienvenue et les boutons **Ouvrir Royale Dames** et **Inviter un ami**.
- **Ouvrir Royale Dames** doit ouvrir l’URL Vercel.
- **Inviter un ami** doit envoyer un lien du type `https://ton-app.vercel.app/?room=XXXXXX`. En ouvrant ce lien et en te connectant, tu dois arriver dans la salle privée avec le code affiché.

---

## 5. Résumé des fichiers de déploiement

| Fichier        | Rôle                                                                 |
|----------------|----------------------------------------------------------------------|
| `vercel.json` | Build (Vite), répertoire de sortie `dist`, rewrites SPA pour Vercel. |
| `railway.toml`| Commande de démarrage et politique de redémarrage pour Railway.     |
| `package.json`| Script `start` = `node telegram-bot.cjs` pour Railway.               |

---

## 6. Déploiement en local (CLI)

### Vercel CLI

```bash
npm i -g vercel
vercel
```

Suis les questions (lien au projet existant ou nouveau). Les options de build sont lues depuis `vercel.json`.

### Railway CLI

```bash
npm i -g @railway/cli
railway login
railway link   # lie le dossier au projet/service
railway up     # déploie
```

Les variables d’environnement peuvent être définies dans le dashboard Railway ou avec `railway variables set TELEGRAM_BOT_TOKEN=xxx`.

---

## 7. Serveur WebSocket multijoueur (optionnel)

Pour activer le mode multijoueur en ligne, déploie un **second service Railway** pour le serveur WebSocket. Voir **[DEPLOY-WEBSOCKET.md](./DEPLOY-WEBSOCKET.md)** pour le guide détaillé.

---

En suivant cette procédure, la web app est servie par Vercel et le bot Telegram par Railway, avec les liens d’invitation qui pointent vers ta web app déployée.
