import { ViewIcon } from '@chakra-ui/icons';
import { Box, VStack, Link, Text } from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export function Sidebar() {
  const { appUser } = useAuth();

  const menuItems = [
    {
      name: 'Dashboard do Embaixador',
      icon: <ViewIcon />,
      path: '/ambassador',
      roles: ['ambassador'],
    },
  ];

  return (
    <Box as="nav" p={4} bg="white" boxShadow="sm">
      <VStack spacing={4} align="stretch">
        {menuItems.map((item) => {
          if (item.roles.includes(appUser?.role || '')) {
            return (
              <Link
                as={RouterLink}
                to={item.path}
                key={item.path}
                display="flex"
                alignItems="center"
                p={2}
                borderRadius="md"
                _hover={{ bg: 'gray.100' }}
              >
                {item.icon}
                <Text ml={2}>{item.name}</Text>
              </Link>
            );
          }
          return null;
        })}
      </VStack>
    </Box>
  );
} 