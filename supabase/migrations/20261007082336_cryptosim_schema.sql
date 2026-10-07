/*
# CryptoSim EDU — Core Schema

## Overview
Creates the database tables for a crypto trading simulator with educational focus.
Users sign in with email/password and each user gets a demo credit balance of $100,000.
All data is owner-scoped via user_id with RLS.

## New Tables

### profiles
- `id` (uuid, PK, references auth.users) — one row per user
- `demo_balance` (numeric, default 100000) — fictitious USD balance for trading
- `created_at` (timestamptz)

### holdings
- `id` (uuid, PK)
- `user_id` (uuid, FK to auth.users, DEFAULT auth.uid())
- `coin_id` (text) — e.g. "bitcoin"
- `symbol` (text) — e.g. "BTC"
- `amount` (numeric) — quantity held
- `avg_buy_price` (numeric) — average purchase price
- `updated_at` (timestamptz)
- Unique constraint on (user_id, coin_id)

### trades
- `id` (uuid, PK)
- `user_id` (uuid, FK to auth.users, DEFAULT auth.uid())
- `coin_id` (text)
- `symbol` (text)
- `side` (text) — 'buy' or 'sell'
- `order_type` (text) — 'market' or 'limit'
- `price` (numeric) — execution price
- `quantity` (numeric) — amount traded
- `total` (numeric) — price * quantity
- `market_type` (text) — 'spot' or 'futures'
- `leverage` (integer, default 1) — leverage multiplier for futures
- `created_at` (timestamptz)

### positions
- `id` (uuid, PK)
- `user_id` (uuid, FK to auth.users, DEFAULT auth.uid())
- `coin_id` (text)
- `symbol` (text)
- `side` (text) — 'long' or 'short'
- `leverage` (integer)
- `entry_price` (numeric)
- `quantity` (numeric)
- `margin` (numeric) — collateral locked
- `status` (text) — 'open' or 'closed'
- `exit_price` (numeric, nullable)
- `pnl` (numeric, nullable) — realized profit/loss
- `created_at` (timestamptz)
- `closed_at` (timestamptz, nullable)

## Security
- RLS enabled on all tables.
- All tables are owner-scoped: policies check auth.uid() = user_id.
- user_id columns default to auth.uid() so inserts work without passing user_id.
- profiles table uses id = auth.uid() as PK.
*/

-- Profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  demo_balance numeric NOT NULL DEFAULT 100000,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_profile" ON profiles;
CREATE POLICY "select_own_profile" ON profiles FOR SELECT
TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "insert_own_profile" ON profiles;
CREATE POLICY "insert_own_profile" ON profiles FOR INSERT
TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "update_own_profile" ON profiles;
CREATE POLICY "update_own_profile" ON profiles FOR UPDATE
TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "delete_own_profile" ON profiles;
CREATE POLICY "delete_own_profile" ON profiles FOR DELETE
TO authenticated USING (auth.uid() = id);

-- Holdings table
CREATE TABLE IF NOT EXISTS holdings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  coin_id text NOT NULL,
  symbol text NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  avg_buy_price numeric NOT NULL DEFAULT 0,
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, coin_id)
);

ALTER TABLE holdings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_holdings" ON holdings;
CREATE POLICY "select_own_holdings" ON holdings FOR SELECT
TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_holdings" ON holdings;
CREATE POLICY "insert_own_holdings" ON holdings FOR INSERT
TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_holdings" ON holdings;
CREATE POLICY "update_own_holdings" ON holdings FOR UPDATE
TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_holdings" ON holdings;
CREATE POLICY "delete_own_holdings" ON holdings FOR DELETE
TO authenticated USING (auth.uid() = user_id);

-- Trades table
CREATE TABLE IF NOT EXISTS trades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  coin_id text NOT NULL,
  symbol text NOT NULL,
  side text NOT NULL CHECK (side IN ('buy', 'sell')),
  order_type text NOT NULL DEFAULT 'market' CHECK (order_type IN ('market', 'limit')),
  price numeric NOT NULL,
  quantity numeric NOT NULL,
  total numeric NOT NULL,
  market_type text NOT NULL DEFAULT 'spot' CHECK (market_type IN ('spot', 'futures')),
  leverage integer NOT NULL DEFAULT 1,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE trades ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_trades" ON trades;
CREATE POLICY "select_own_trades" ON trades FOR SELECT
TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_trades" ON trades;
CREATE POLICY "insert_own_trades" ON trades FOR INSERT
TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_trades" ON trades;
CREATE POLICY "update_own_trades" ON trades FOR UPDATE
TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_trades" ON trades;
CREATE POLICY "delete_own_trades" ON trades FOR DELETE
TO authenticated USING (auth.uid() = user_id);

-- Positions table (futures)
CREATE TABLE IF NOT EXISTS positions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  coin_id text NOT NULL,
  symbol text NOT NULL,
  side text NOT NULL CHECK (side IN ('long', 'short')),
  leverage integer NOT NULL DEFAULT 1,
  entry_price numeric NOT NULL,
  quantity numeric NOT NULL,
  margin numeric NOT NULL,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  exit_price numeric,
  pnl numeric,
  created_at timestamptz DEFAULT now(),
  closed_at timestamptz
);

ALTER TABLE positions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_positions" ON positions;
CREATE POLICY "select_own_positions" ON positions FOR SELECT
TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_positions" ON positions;
CREATE POLICY "insert_own_positions" ON positions FOR INSERT
TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_positions" ON positions;
CREATE POLICY "update_own_positions" ON positions FOR UPDATE
TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_positions" ON positions;
CREATE POLICY "delete_own_positions" ON positions FOR DELETE
TO authenticated USING (auth.uid() = user_id);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_holdings_user_id ON holdings(user_id);
CREATE INDEX IF NOT EXISTS idx_trades_user_id ON trades(user_id);
CREATE INDEX IF NOT EXISTS idx_trades_created_at ON trades(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_positions_user_id ON positions(user_id);
CREATE INDEX IF NOT EXISTS idx_positions_status ON positions(status);

-- Function to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, demo_balance)
  VALUES (NEW.id, 100000)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();