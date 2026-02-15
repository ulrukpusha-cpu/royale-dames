# Smart Contract Paris — Royale Dames (FunC)

Contrat FunC pour les paris 1v1 : dépôt par les deux joueurs, puis paiement au gagnant après résolution par l'owner.

---

## Flux

1. **Place bet** (op 1) : joueur 1 envoie TON + op 1 → devient player1, status = waiting  
2. **Join bet** (op 2) : joueur 2 envoie le même montant + op 2 → status = matched  
3. **Resolve** (op 3) : owner envoie op 3 + adresse du gagnant → paiement au gagnant (2× mise − 2 % de fee)

---

## Structure du storage

```
owner:MsgAddress
player1:MsgAddress
player2:MsgAddress
amount:Coins
status:uint8  (0=vide, 1=waiting, 2=matched)
```

---

## Format des messages

### Place bet (op = 1)
- Body : `op (32 bits)`
- Value : mise en nanotons (min 0.1 TON)

### Join bet (op = 2)
- Body : `op (32 bits)`
- Value : même montant que player1

### Resolve (op = 3)
- Body : `op (32 bits)` + `winner:MsgAddress`
- Envoyé par l’**owner** uniquement

---

## Compilation

### Option 1 : Blueprint (recommandé)

```bash
npx create-ton@latest my-ton-project
cd my-ton-project
# Copier royale-dames-bet.fc dans contracts/
# Le stdlib est fourni par Blueprint
blueprint build
```

### Option 1b : TON Foundation template

```bash
git clone https://github.com/ton-blockchain/template-func-counter
cd template-func-counter
# Remplacer counter.fc par royale-dames-bet.fc
# Adapter le chemin du stdlib selon le template
```

### Option 2 : func-js

```bash
npm i @ton-community/func-js
node -e "
const { compileFunc } = require('@ton-community/func-js');
compileFunc({
  targets: ['royale-dames-bet.fc'],
  sources: { 'stdlib.fc': '...' }
}).then(r => console.log(r.result));
"
```

### Option 3 : TON CLI

```bash
func -o royale-dames-bet.fif -SPA contracts/royale-dames-bet.fc
fift -s royale-dames-bet.fif
```

---

## Déploiement

1. Compiler le contrat  
2. Créer le state init avec l’adresse **owner** (ton backend / wallet admin)  
3. Déployer sur mainnet ou testnet  
4. Renseigner l’adresse du contrat dans `src/services/ton.ts` :

```ts
const contractAddress = 'EQ...'; // Adresse déployée
```

---

## Intégration frontend

Dans `src/services/ton.ts`, pour `placeBet` :

```ts
const op = 1; // place_bet
const body = beginCell().storeUint(op, 32).endCell();
// Envoyer message avec TonConnect...
```

Pour `resolve` (côté backend uniquement) :

```ts
const op = 3;
const body = beginCell()
  .storeUint(op, 32)
  .storeAddress(Address.parse(winnerAddress))
  .endCell();
```

---

## Sécurité

- L’**owner** doit être une clé sécurisée (backend) qui ne resolve qu’après validation du résultat de la partie (serveur WebSocket, base de données, etc.).
- Vérifier que le gagnant fait bien partie de la partie (player1 ou player2) avant d’appeler `resolve`.
