-- Remove funções existentes
DROP FUNCTION IF EXISTS delete_student_feedbacks(UUID);
DROP FUNCTION IF EXISTS delete_student(UUID);

-- Função para deletar feedbacks de um aluno
CREATE OR REPLACE FUNCTION delete_student_feedbacks(p_student_id UUID)
RETURNS void AS $$
BEGIN
  DELETE FROM cs_feedback_notes WHERE student_id = p_student_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para deletar um aluno
CREATE OR REPLACE FUNCTION delete_student(p_student_id UUID)
RETURNS void AS $$
BEGIN
  DELETE FROM cs_students WHERE id = p_student_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 