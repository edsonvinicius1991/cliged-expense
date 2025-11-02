-- Migração de usuários da tabela customizada para auth.users
-- Execute este SQL no painel do Supabase (SQL Editor)
-- Data: 2025-01-27

-- Função para criar usuários no auth.users (requer privilégios de admin)
DO $$
DECLARE
    user_record RECORD;
    new_user_id UUID;
BEGIN
    -- Migrar usuário: admin@cliged.com
    INSERT INTO auth.users (
        instance_id,
        id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        recovery_sent_at,
        last_sign_in_at,
        raw_app_meta_data,
        raw_user_meta_data,
        created_at,
        updated_at,
        confirmation_token,
        email_change,
        email_change_token_new,
        recovery_token
    ) VALUES (
        '00000000-0000-0000-0000-000000000000',
        gen_random_uuid(),
        'authenticated',
        'authenticated',
        'admin@cliged.com',
        crypt('senha_temporaria_123', gen_salt('bf')),
        NOW(),
        NOW(),
        NOW(),
        '{"provider": "email", "providers": ["email"]}',
        '{"name": "admin", "role": "ADMIN", "migrated_from_custom_table": true, "original_id": "58af9bcf-e5f2-4a68-a307-1ecc5455b36b", "migrated_at": "2025-01-27T22:00:00.000Z"}',
        '2025-11-01 21:52:43.874107+00',
        NOW(),
        '',
        '',
        '',
        ''
    ) ON CONFLICT (email) DO NOTHING;

    -- Migrar usuário: user@cliged.com
    INSERT INTO auth.users (
        instance_id,
        id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        recovery_sent_at,
        last_sign_in_at,
        raw_app_meta_data,
        raw_user_meta_data,
        created_at,
        updated_at,
        confirmation_token,
        email_change,
        email_change_token_new,
        recovery_token
    ) VALUES (
        '00000000-0000-0000-0000-000000000000',
        gen_random_uuid(),
        'authenticated',
        'authenticated',
        'user@cliged.com',
        crypt('senha_temporaria_123', gen_salt('bf')),
        NOW(),
        NOW(),
        NOW(),
        '{"provider": "email", "providers": ["email"]}',
        '{"name": "user", "role": "COLABORADOR", "migrated_from_custom_table": true, "original_id": "81c858a5-5c10-4b31-b88a-5b51154c1530", "migrated_at": "2025-01-27T22:00:00.000Z"}',
        '2025-11-01 21:52:43.874107+00',
        NOW(),
        '',
        '',
        '',
        ''
    ) ON CONFLICT (email) DO NOTHING;

END $$;

-- Verificar usuários migrados
SELECT 
    id,
    email,
    raw_user_meta_data->>'name' as name,
    raw_user_meta_data->>'role' as role,
    email_confirmed_at,
    created_at
FROM auth.users 
WHERE raw_user_meta_data->>'migrated_from_custom_table' = 'true'
ORDER BY created_at;

-- Instruções pós-migração:
-- 1. Execute este SQL no painel do Supabase (SQL Editor)
-- 2. Verifique se os usuários foram criados corretamente com a query acima
-- 3. Os usuários podem fazer login com:
--    - Email: admin@cliged.com ou user@cliged.com
--    - Senha: senha_temporaria_123
-- 4. Oriente os usuários a alterarem suas senhas após o primeiro login
-- 5. Considere implementar um fluxo de redefinição de senha obrigatória