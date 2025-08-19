-- Patch para garantir campos necessários na tabela cameras
ALTER TABLE cameras
  ADD COLUMN IF NOT EXISTS responsavel_id bigint references users(id) on delete set null,
  ADD COLUMN IF NOT EXISTS responsavel_nome text,
  ADD COLUMN IF NOT EXISTS created_at timestamp with time zone default now();
