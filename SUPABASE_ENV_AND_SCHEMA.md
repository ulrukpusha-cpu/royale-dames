# Variables d'environnement et schéma Supabase – Royale Dames

## 1. Variables d'environnement à configurer

Ces variables servent à **votre application** (frontend / backend), pas à « Supabase pour les utilisateurs ». Vous les définissez dans **.env** en local et dans **Vercel** (ou autre hébergeur) pour la prod.

### Obligatoires pour Supabase

| Variable | Description | Où la trouver |
|----------|-------------|----------------|
| `VITE_SUPABASE_URL` | URL du projet Supabase | Dashboard → Project Settings → API → Project URL |
| `VITE_SUPABASE_ANON_KEY` | Clé publique (anon) pour le frontend | Dashboard → Project Settings → API → anon public |

Exemple :
```env
VITE_SUPABASE_URL=https://eklfniunoejvgwvwyjao.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Optionnelles (serveur / backend uniquement)

| Variable | Description | Usage |
|----------|-------------|--------|
| `SUPABASE_SERVICE_ROLE_KEY` | Clé secrète (bypass RLS) | **Uniquement** côté serveur (Node, Edge Functions). Ne jamais exposer dans le frontend. |

À utiliser si vous avez un backend qui doit modifier des données sans passer par les règles RLS (ex. créditer les $Dames, gérer les coffres).

### Autres variables utiles pour le jeu

| Variable | Description | Défaut |
|----------|-------------|--------|
| `VITE_WS_URL` | URL du serveur WebSocket (multiplayer) | `http://localhost:3001` |
| `VITE_TON_BET_CONTRACT` | Adresse du contrat TON pour les paris | — |
| `VITE_BASE_PATH` | Chemin de base si l'app est sous un sous-dossier | `/` |

---

## 2. Où configurer ces variables

- **En local :** fichier **.env** à la racine du projet (déjà dans .gitignore).
- **En production (ex. Vercel) :**  
  **Project → Settings → Environment Variables**  
  Ajoutez au minimum `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY` pour Production (et Preview si besoin).

Supabase ne demande pas de variables « pour les utilisateurs » : les données utilisateurs sont dans les **tables** (profils, coffres, parrainage, etc.). Les variables ci‑dessus servent uniquement à ce que votre app se connecte au bon projet Supabase.

---

## 3. Schéma Supabase (tables pour les utilisateurs)

Le fichier **`supabase/migrations/001_initial_schema.sql`** crée les tables suivantes.

### 3.1 Table `profiles` (par utilisateur)

- **external_id** : identifiant unique (ex. Telegram `user.id`, Google `sub`).
- **provider** : `telegram` | `google` | `guest`.
- **username**, **display_name**, **avatar_url** : infos affichées.
- **dames_balance** : points **$Dames** du joueur (défaut 500).
- **fiat_balance_cents** : solde fiat en centimes (ex. XOF).
- **fiat_currency** : ex. `XOF`.
- **crypto_balance_ton**, **ton_address** : solde et adresse TON.
- **referral_code** : code unique pour le **lien de parrainage** (ex. `?ref=ABC12XYZ`).
- **referred_by_id** : profil du parrain (si inscrit via un lien de parrainage).

### 3.2 Table `vaults` (coffres sécurisés)

- Un enregistrement par (utilisateur, type) : **dames**, **fiat**, **ton**.
- **amount** : montant « verrouillé » dans le coffre.
- **unlocked_at** : optionnel (coffre à terme).

### 3.3 Table `referrals` (parrainage)

- **referrer_id** : parrain.
- **referred_id** : filleul.
- **reward_dames** : récompense $Dames pour le parrain.
- **reward_claimed_at** : date d’attribution de la récompense.

### 3.4 Table `transactions` (historique)

- **type** : `daily_checkin`, `game_win`, `game_loss`, `referral_reward`, `vault_deposit`, `vault_withdraw`, `fiat_deposit`, `fiat_withdraw`, `convert`, etc.
- **amount_dames**, **amount_fiat_cents**, **amount_crypto** : montants selon le type.
- **metadata** (JSONB) : ex. `game_id`, `referral_id`, pour l’audit.

---

## 4. Appliquer le schéma dans Supabase

1. Ouvrez **Supabase Dashboard** → votre projet.
2. Allez dans **SQL Editor** → **New query**.
3. Copiez-collez **tout le contenu** de `supabase/migrations/001_initial_schema.sql`.
4. Cliquez sur **Run**.

Les tables `profiles`, `vaults`, `referrals`, `transactions` seront créées avec les politiques RLS de base.

---

## 5. Résumé : env pour l’app, données pour les utilisateurs

- **Variables d’environnement** : elles permettent à **votre app** de se connecter à Supabase (URL + anon key, et optionnellement service_role côté serveur). À ajouter dans **.env** et dans l’hébergeur (ex. Vercel).
- **Points $Dames, parrainage, coffres, wallet fiat** : ce sont des **données** stockées dans les tables Supabase (`profiles`, `vaults`, `referrals`, `transactions`). Il n’y a pas de variables « env à ajouter dans Supabase pour les utilisateurs » : une fois le schéma appliqué (étape 4), vous utilisez le client Supabase dans le code pour lire/écrire ces tables (et éventuellement Supabase Auth pour l’id utilisateur).

Pour connecter l’app au schéma (sauvegarder les $Dames, le fiat, les coffres et le parrainage en base), il faudra ensuite appeler ces tables depuis `src/lib/supabase.ts` (et, si besoin, un petit backend ou des Edge Functions pour les opérations sensibles avec la clé service_role).
