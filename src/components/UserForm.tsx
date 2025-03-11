import { useState, FormEvent } from 'react';
import {
  FormControl,
  FormLabel,
  Input,
  Select,
  Button,
  VStack,
} from '@chakra-ui/react';
import { UserRole, UserFormData } from '../types/user';

interface UserFormProps {
  onSubmit: (data: UserFormData) => void;
}

export const UserForm = ({ onSubmit }: UserFormProps) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>(UserRole.SUPPORT);

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
            onChange={(e) => setRole(e.target.value as UserRole)}
          >
            <option value={UserRole.ADMIN}>Administrador</option>
            <option value={UserRole.SUPPORT}>Suporte</option>
            <option value={UserRole.COMMERCIAL}>Comercial</option>
            <option value={UserRole.TEACHER}>Professor</option>
            <option value={UserRole.DESIGNER}>Designer</option>
          </Select>
        </FormControl>

        <Button type="submit" colorScheme="blue" width="full">
          Criar Usuário
        </Button>
      </VStack>
    </form>
  );
}; 