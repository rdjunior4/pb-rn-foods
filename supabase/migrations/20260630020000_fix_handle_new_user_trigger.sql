-- ============================================================
-- Fix: Recreate handle_new_user trigger to fix 500 on signup
-- The trigger may have been dropped or broken by a prior migration.
-- ============================================================

-- 1. Recreate the function with full exception safety
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_name TEXT := '';
  v_document TEXT := '';
  v_doc_type TEXT := 'cpf';
BEGIN
  IF NEW.raw_user_meta_data IS NOT NULL THEN
    v_name := COALESCE(NEW.raw_user_meta_data->>'name', '');
    v_document := COALESCE(NEW.raw_user_meta_data->>'document', '');
    v_doc_type := COALESCE(NEW.raw_user_meta_data->>'document_type', 'cpf');
  END IF;

  INSERT INTO profiles (id, email, name, document, document_type, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    v_name,
    v_document,
    v_doc_type::document_type,
    'customer'
  )
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    document = EXCLUDED.document,
    document_type = EXCLUDED.document_type;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'handle_new_user failed for %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Drop and recreate the trigger to ensure it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
