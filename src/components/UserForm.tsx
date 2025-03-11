import { useState, FormEvent } from 'react';
import {
  FormControl,
  FormLabel,
  Input,
  Select,
  Button,
  VStack,
} from '@chakra-ui/react';

interface UserFormProps {
  onSubmit: (data: { name: string; email: string; role: string }) => void;
}

export const UserForm = ({ onSubmit }: UserFormProps) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('support');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit({ name, email, role });
  };

  return (
    <form onSubmit={handleSubmit}>
      <VStack spacing={4}>
        <FormControl isRequired>
          <FormLabel>Nome</FormLabel>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nome completo"
          />
        </FormControl>

        <FormControl isRequired>
          <FormLabel>Email</FormLabel>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email@exemplo.com"
          />
        </FormControl>

        <FormControl isRequired>
          <FormLabel>Cargo</FormLabel>
          <Select
            value={role}
            onChange={(e) => setRole(e.target.value)}
          >
            <option value="admin">Administrador</option>
            <option value="support">Suporte</option>
            <option value="commercial">Comercial</option>
            <option value="essay_director">Diretor de Redação</option>
          </Select>
        </FormControl>

        <Button type="submit" colorScheme="blue" width="full">
          Criar Usuário
        </Button>
      </VStack>
    </form>
  );
}; 