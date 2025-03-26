-- Função para buscar alunos com last_credit_removed anterior a uma data específica
CREATE OR REPLACE FUNCTION get_students_with_old_credit_removal()
RETURNS TABLE (
  id UUID,
  name TEXT,
  email TEXT,
  last_credit_removed TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    es.id,
    es.name,
    es.email,
    es.last_credit_removed,
    es.created_at
  FROM essay_students es
  WHERE es.last_credit_removed < '2025-03-17'::timestamp
  ORDER BY es.last_credit_removed ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 