# Configuration TON Connect — Royale Dames

TonConnect permet aux joueurs de connecter leur wallet TON (Tonkeeper, etc.) pour parier et gagner en crypto.

---

## 1. Manifest TonConnect

Le fichier `public/tonconnect-manifest.json` décrit ton app pour les wallets TON.

### Contenu actuel

```json
{
  "url": "https://royale-dames.vercel.app",
  "name": "Royale Dames",
  "iconUrl": "https://royale-dames.vercel.app/icon-180.png"
}
```

### À adapter

| Champ | Description |
|-------|-------------|
| `url` | URL de ton app (sans `/` final). Ex : `https://royale-dames.vercel.app` |
| `name` | Nom affiché dans le wallet |
| `iconUrl` | Icône 180×180 px (PNG). Place un fichier `icon-180.png` dans `public/` |

### Règles pour le manifest

- Sert depuis ton domaine (HTTPS)
- Accessible en GET sans auth
- CORS désactivé pour le manifest

---

## 2. Variables d'environnement

Aucune variable spécifique TonConnect n'est nécessaire. Le manifest est chargé via l’URL de l’app.

---

## 3. Intégration dans le code

### Service `src/services/ton.ts`

- **Manifest** : `${window.location.origin}/tonconnect-manifest.json` en local, `https://royale-dames.vercel.app/tonconnect-manifest.json` en build
- **TonCenter** : API publique pour le solde TON
- **Contrat** : `VOTRE_ADRESSE_CONTRACT` dans `placeBet` et `withdrawWinnings` → à remplacer par l’adresse de ton contrat TON

### Utilisation dans l’app

- **BettingPanel** : `getWallets()`, `connectTonWallet()`, `getTonBalance()`, `placeBet()`
- **Modal Wallet** : option « TON Wallet (externe) » → `connectTON()` (à brancher sur le service TonConnect)

---

## 4. Déploiement (Vercel)

Le manifest est servi automatiquement :

- URL : `https://ton-royale-dames.vercel.app/tonconnect-manifest.json`
- Vérifier : ouvrir cette URL dans un navigateur

---

## 5. Icône recommandée

1. Créer ou générer une icône 180×180 px (PNG)
2. La placer dans `public/icon-180.png`
3. Le manifest utilisera : `https://ton-domaine.vercel.app/icon-180.png`

Tu peux aussi utiliser `/favicon.ico` si tu préfères.

---

## 6. Contrat TON (paris)

Pour des paris réels en TON, il faut un smart contract sur TON. En attendant :

- `placeBet` et `withdrawWinnings` utilisent `VOTRE_ADRESSE_CONTRACT`
- Remplacer cette adresse par l’adresse de ton contrat déployé
- Sans contrat déployé, les transactions échoueront

---

## Résumé

| Élément | Fichier / Emplacement |
|---------|------------------------|
| Manifest | `public/tonconnect-manifest.json` |
| Service | `src/services/ton.ts` |
| Icône | `public/icon-180.png` (à ajouter) |
| Adresse contrat | À remplacer dans `ton.ts` |
