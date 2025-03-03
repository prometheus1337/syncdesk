-- Adicionar coluna close_date na tabela data
ALTER TABLE public.data ADD COLUMN close_date TIMESTAMP WITH TIME ZONE;

-- Criar função para atualizar close_date quando concluido for alterado para true
CREATE OR REPLACE FUNCTION update_close_date()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.concluido = true AND (OLD.concluido = false OR OLD.concluido IS NULL) THEN
        NEW.close_date = TIMEZONE('utc'::text, NOW());
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para atualizar close_date
CREATE TRIGGER update_data_close_date
    BEFORE UPDATE ON public.data
    FOR EACH ROW
    EXECUTE FUNCTION update_close_date(); 