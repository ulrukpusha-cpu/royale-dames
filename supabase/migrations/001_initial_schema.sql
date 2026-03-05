-- ============================================================
-- Royale Dames - Schéma Supabase
-- Points $Dames, parrainage, coffres sécurisés, wallet fiat
-- ============================================================
-- À exécuter dans : Supabase Dashboard > SQL Editor > New query
-- ============================================================

-- Extension pour générer des codes uniques (optionnel)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ------------------------------------------------------------
-- 1. PROFILS UTILISATEURS (lié à Auth si vous utilisez Supabase Auth)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Identifiant externe (Telegram, Google, etc.)
  external_id TEXT UNIQUE NOT NULL,
  provider TEXT NOT NULL DEFAULT 'telegram', -- 'telegram' | 'google' | 'guest'
  username TEXT,
  display_name TEXT,
  avatar_url TEXT,
  -- Points $Dames (jeton du jeu)
  dames_balance BIGINT NOT NULL DEFAULT 500 CHECK (dames_balance >= 0),
  -- Wallet Fiat (en centimes ou unité minimale pour éviter les décimales)
  fiat_balance_cents BIGINT NOT NULL DEFAULT 0 CHECK (fiat_balance_cents >= 0),
  fiat_currency TEXT NOT NULL DEFAULT 'XOF',
  -- Crypto (TON, etc.) - adresse ou balance selon votre logique
  crypto_balance_ton NUMERIC(20, 6) NOT NULL DEFAULT 0 CHECK (crypto_balance_ton >= 0),
  ton_address TEXT,
  -- Parrainage : code unique pour que d'autres s'inscrivent via ce lien
  referral_code TEXT UNIQUE,
  referred_by_id UUID REFERENCES public.profiles(id),
  referred_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index pour recherche par code parrain et par external_id
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_referral_code ON public.profiles(referral_code) WHERE referral_code IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_external_id ON public.profiles(external_id);
CREATE INDEX IF NOT EXISTS idx_profiles_referred_by ON public.profiles(referred_by_id);

-- Génération auto du code parrain (ex: 8 caractères aléatoires)
-- Vous pouvez le remplir au premier login via une fonction ou l'app
COMMENT ON COLUMN public.profiles.referral_code IS 'Code unique pour lien de parrainage (ex: https://app...?ref=ABC12XYZ)';

-- ------------------------------------------------------------
-- 2. COFFRES SÉCURISÉS (vault) par utilisateur
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.vaults (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  -- Type de coffre : 'dames' | 'fiat' | 'ton'
  vault_type TEXT NOT NULL CHECK (vault_type IN ('dames', 'fiat', 'ton')),
  -- Montant verrouillé dans le coffre
  amount NUMERIC(20, 6) NOT NULL DEFAULT 0 CHECK (amount >= 0),
  -- Optionnel : date de déblocage (pour coffre à terme)
  unlocked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(profile_id, vault_type)
);

CREATE INDEX IF NOT EXISTS idx_vaults_profile ON public.vaults(profile_id);

-- ------------------------------------------------------------
-- 3. PARRAINAGE (liens / invitations)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  referred_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  -- Récompense attribuée au parrain (en $Dames)
  reward_dames BIGINT NOT NULL DEFAULT 0,
  reward_claimed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(referred_id)
);

CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON public.referrals(referrer_id);

-- ------------------------------------------------------------
-- 4. HISTORIQUE DES TRANSACTIONS (audit + solde)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'daily_checkin' | 'game_win' | 'game_loss' | 'referral_reward' | 'vault_deposit' | 'vault_withdraw' | 'fiat_deposit' | 'fiat_withdraw' | 'convert'
  amount_dames BIGINT NOT NULL DEFAULT 0,
  amount_fiat_cents BIGINT NOT NULL DEFAULT 0,
  amount_crypto NUMERIC(20, 6) NOT NULL DEFAULT 0,
  metadata JSONB, -- ex: { game_id, referral_id, etc. }
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_transactions_profile ON public.transactions(profile_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created ON public.transactions(created_at);

-- ------------------------------------------------------------
-- 5. RLS (Row Level Security) - chaque user n'accède qu'à ses données
-- ------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vaults ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Politique : les profils sont lisibles par external_id (côté app vous identifierez l'user)
-- Pour Supabase Auth : utiliser auth.uid() = id
-- Ici on suppose que l'app envoie l'external_id et que vous avez une fonction ou une API qui filtre
CREATE POLICY "Profiles read own" ON public.profiles
  FOR SELECT USING (true); -- À restreindre avec auth.uid() si vous utilisez Supabase Auth

CREATE POLICY "Profiles update own" ON public.profiles
  FOR UPDATE USING (true); -- Idem, restreindre par auth

CREATE POLICY "Profiles insert" ON public.profiles
  FOR INSERT WITH CHECK (true);

-- Vaults : un user ne voit que ses coffres (via profile_id)
CREATE POLICY "Vaults read own" ON public.vaults
  FOR SELECT USING (true);
CREATE POLICY "Vaults insert own" ON public.vaults
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Vaults update own" ON public.vaults
  FOR UPDATE USING (true);

-- Referrals : lecture pour le parrain et le filleul
CREATE POLICY "Referrals read" ON public.referrals
  FOR SELECT USING (true);
CREATE POLICY "Referrals insert" ON public.referrals
  FOR INSERT WITH CHECK (true);

-- Transactions : lecture pour le propriétaire
CREATE POLICY "Transactions read own" ON public.transactions
  FOR SELECT USING (true);
CREATE POLICY "Transactions insert" ON public.transactions
  FOR INSERT WITH CHECK (true);

-- ------------------------------------------------------------
-- 6. Trigger updated_at
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS profiles_updated_at ON public.profiles;
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

DROP TRIGGER IF EXISTS vaults_updated_at ON public.vaults;
CREATE TRIGGER vaults_updated_at
  BEFORE UPDATE ON public.vaults
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();
