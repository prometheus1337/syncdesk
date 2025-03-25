-- Função para deletar feedbacks de um aluno
CREATE OR REPLACE FUNCTION delete_student_feedbacks(student_id UUID)
RETURNS void AS $$
BEGIN
  DELETE FROM cs_feedback_notes WHERE student_id = $1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para deletar um aluno
CREATE OR REPLACE FUNCTION delete_student(student_id UUID)
RETURNS void AS $$
BEGIN
  DELETE FROM cs_students WHERE id = $1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 