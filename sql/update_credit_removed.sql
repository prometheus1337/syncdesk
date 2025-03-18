-- Remover trigger existente
DROP TRIGGER IF EXISTS update_credit_removed_trigger ON essay_credit_logs;

-- Remover função existente
DROP FUNCTION IF EXISTS update_last_credit_removed();

-- Criar função para atualizar last_credit_removed quando houver redução
CREATE OR REPLACE FUNCTION update_last_credit_removed()
RETURNS TRIGGER AS $$
BEGIN
    -- Se for uma operação de redução, atualiza last_credit_removed
    IF NEW.operation_type = 'remove' THEN
        -- Atualiza o aluno com a data da última redução
        UPDATE essay_students
        SET 
            last_credit_removed = NEW.created_at,
            updated_at = NEW.created_at
        WHERE email = NEW.student_email;

        -- Se não encontrou o aluno, cria um novo registro
        IF NOT FOUND THEN
            INSERT INTO essay_students (
                email,
                name,
                created_at,
                updated_at,
                last_credit_update,
                last_credit_removed
            ) VALUES (
                NEW.student_email,
                NEW.student_name,
                NEW.created_at,
                NEW.created_at,
                NEW.created_at,
                NEW.created_at
            );
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar trigger para executar a função após a inserção
CREATE TRIGGER update_credit_removed_trigger
    AFTER INSERT ON essay_credit_logs
    FOR EACH ROW
    EXECUTE FUNCTION update_last_credit_removed(); 