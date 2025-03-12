-- Criar função para atualizar last_credit_removed quando houver redução
CREATE OR REPLACE FUNCTION update_last_credit_removed()
RETURNS TRIGGER AS $$
DECLARE
    _now TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Pega o timestamp atual
    _now := TIMEZONE('utc'::text, NOW());
    
    -- Se for uma operação de redução, atualiza last_credit_removed
    IF NEW.operation_type = 'remove' THEN
        UPDATE essay_students
        SET 
            last_credit_removed = _now,
            last_credit_update = _now
        WHERE email = NEW.student_email;
    ELSE
        -- Se não for redução, atualiza apenas last_credit_update
        UPDATE essay_students
        SET last_credit_update = _now
        WHERE email = NEW.student_email;
    END IF;
    
    -- Atualiza o created_at do log
    NEW.created_at = _now;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Remover trigger existente
DROP TRIGGER IF EXISTS update_credit_removed_trigger ON essay_credit_logs;

-- Criar trigger para executar a função ANTES da inserção
CREATE TRIGGER update_credit_removed_trigger
    BEFORE INSERT ON essay_credit_logs
    FOR EACH ROW
    EXECUTE FUNCTION update_last_credit_removed(); 