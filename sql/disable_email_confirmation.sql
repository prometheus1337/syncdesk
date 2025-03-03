-- Desabilitar confirmação de email para novos usuários
update auth.config 
set confirm_email_on_signup = false; 