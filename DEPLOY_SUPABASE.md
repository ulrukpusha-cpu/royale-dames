# Déploiement Royale Dames avec Supabase

## 1. Configuration Supabase (déjà faite)

Le projet est configuré pour utiliser votre projet Supabase :

- **URL :** `https://eklfniunoejvgwvwyjao.supabase.co`
- **Clé API (publique) :** définie dans `.env` (fichier local, non versionné)

Fichiers concernés :
- `src/lib/supabase.ts` : client Supabase (utilisable partout avec `import { supabase } from '@/lib/supabase'`)
- `.env` : contient `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY` (ne pas committer)
- `.env.example` : modèle pour les autres développeurs

### Clé API

Si vous utilisez la **clé anon** classique (JWT, commence par `eyJ...`) au lieu de la clé « publiable », remplacez dans `.env` :

```env
VITE_SUPABASE_ANON_KEY=eyJ...votre_cle_anon...
```

Vous la trouvez dans : **Supabase Dashboard** → **Project Settings** → **API** → **Project API keys** → **anon public**.

---

## 2. Tester en local

```bash
npm install
npm run build
npm run preview
```

Vérifiez que l’app fonctionne avec l’URL et la clé définies dans `.env`.

---

## 3. Déployer le frontend (recommandé : Vercel)

Supabase gère la **base de données et l’API**. Pour **héberger l’app React (frontend)**, le plus simple est d’utiliser **Vercel** (gratuit).

### Étapes

1. **Pousser le code sur GitHub** (si ce n’est pas déjà fait).
2. Aller sur [vercel.com](https://vercel.com), se connecter avec GitHub.
3. **Import** du dépôt `royale-dames`.
4. **Variables d’environnement** (avant de déployer) :
   - `VITE_SUPABASE_URL` = `https://eklfniunoejvgwvwyjao.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` = votre clé (celle de `.env` ou la clé anon du dashboard Supabase).
5. **Build** : laisser **Build Command** = `npm run build` et **Output Directory** = `dist`.
6. Cliquer sur **Deploy**.

Vercel redéploiera à chaque push sur la branche connectée (souvent `main`).

---

## 4. Alternative : hébergement statique Supabase (Storage)

Vous pouvez servir le build Vite depuis un **bucket Storage** Supabase en public.

### 4.1 Créer un bucket

1. **Supabase Dashboard** → **Storage** → **New bucket**.
2. Nom (ex. `web` ou `app`).
3. Cocher **Public bucket** (pour que les fichiers soient accessibles en lecture).

### 4.2 Build et upload

```bash
npm run build
```

Puis dans le dashboard Supabase : **Storage** → votre bucket → **Upload** et envoyer **tout le contenu** du dossier `dist/` (y compris `index.html` et le dossier `assets/`).

### 4.3 URL du site

L’app sera accessible à une URL du type :

```
https://eklfniunoejvgwvwyjao.supabase.co/storage/v1/object/public/web/index.html
```

Pour que la racine du site ouvre l’app, il faudra éventuellement configurer une **redirection** ou une **page d’accueil** dans Supabase (selon les options disponibles). En pratique, **Vercel (ou Netlify) est plus adapté** pour une SPA React.

---

## 5. Résumé

| Rôle              | Où c’est hébergé |
|-------------------|-------------------|
| **Backend / BDD** | Supabase (votre projet) |
| **Frontend (app)**| Vercel (recommandé) ou Netlify, ou Storage Supabase |

Une fois le front déployé sur Vercel, l’app utilisera automatiquement l’URL et la clé définies dans les variables d’environnement pour appeler Supabase.
