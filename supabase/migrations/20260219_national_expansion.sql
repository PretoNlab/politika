-- Migration: Expansão Nacional do Politika
-- Adiciona suporte para múltiplos estados brasileiros nos workspaces

-- 1. Adiciona coluna 'state' (estado brasileiro)
ALTER TABLE workspaces
  ADD COLUMN IF NOT EXISTS state TEXT DEFAULT 'Bahia';

-- 2. Atualiza a coluna 'region' para texto livre (se era enum antes)
-- Já deve existir como TEXT; garante que é text livre
ALTER TABLE workspaces
  ALTER COLUMN region TYPE TEXT;

-- 3. Adiciona coluna 'custom_context' para contexto político local customizável
ALTER TABLE workspaces
  ADD COLUMN IF NOT EXISTS custom_context TEXT DEFAULT NULL;

-- 4. Retrocompatibilidade: workspaces antigos sem estado ficam na Bahia
UPDATE workspaces
  SET state = 'Bahia'
  WHERE state IS NULL;

-- 5. Torna NOT NULL após o update (opcional, mas recomendado)
ALTER TABLE workspaces
  ALTER COLUMN state SET NOT NULL;

-- Verificação final
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'workspaces'
  AND column_name IN ('state', 'region', 'custom_context')
ORDER BY column_name;
