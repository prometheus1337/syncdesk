import { useState, FormEvent, useEffect } from 'react';
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
  initialData?: {
    full_name: string;
    email: string;
    role: string;
  };
  isEditing?: boolean;
}

export const UserForm = ({ onSubmit, initialData, isEditing = false }: UserFormProps) => {
  const [name, setName] = useState(initialData?.full_name || '');
  const [email, setEmail] = useState(initialData?.email || '');
  const [role, setRole] = useState(initialData?.role || 'support');

  useEffect(() => {
    if (initialData) {
      setName(initialData.full_name);
      setEmail(initialData.email);
      setRole(initialData.role);
    }
  }, [initialData]);

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
            isReadOnly={isEditing}
            bg={isEditing ? "gray.100" : "white"}
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
            <option value="designer">Designer</option>
          </Select>
        </FormControl>

        <Button 
          type="submit" 
          bg="#FFDB01"
          color="black"
          _hover={{ bg: "#E5C501" }}
          width="full"
        >
          {isEditing ? 'Salvar Alterações' : 'Criar Usuário'}
        </Button>
      </VStack>
    </form>
  );
}; 