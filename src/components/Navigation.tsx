import { useState, useEffect } from 'react';
import {
  Flex,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Button,
  Text,
  Link as ChakraLink,
  Avatar,
} from '@chakra-ui/react';
import { ChevronDownIcon } from '@chakra-ui/icons';
import { Link, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface MenuItem {
  id: number;
  title: string;
  type: 'link' | 'dropdown';
  icon: string;
  path: string | null;
  parent_id: number | null;
  order_index: number;
}

export function Navigation() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const location = useLocation();
  const { appUser } = useAuth();

  useEffect(() => {
    fetchMenuItems();
  }, [appUser]);

  async function fetchMenuItems() {
    if (!appUser) return;

    const { data: items, error } = await supabase
      .from('menu_items')
      .select(`
        id,
        title,
        type,
        icon,
        path,
        parent_id,
        order_index
      `)
      .order('order_index');

    if (error) {
      console.error('Erro ao carregar menu:', error);
      return;
    }

    const { data: permissions } = await supabase
      .from('menu_permissions')
      .select('menu_item_id')
      .eq('role', appUser.role);

    if (permissions) {
      const allowedIds = permissions.map(p => p.menu_item_id);
      const filteredItems = items.filter(item => allowedIds.includes(item.id));
      setMenuItems(filteredItems);
    }
  }

  function getDropdownItems(parentId: number) {
    return menuItems
      .filter(item => item.parent_id === parentId)
      .sort((a, b) => a.order_index - b.order_index);
  }

  function getMainItems() {
    return menuItems
      .filter(item => !item.parent_id)
      .sort((a, b) => a.order_index - b.order_index);
  }

  return (
    <Flex 
      as="nav" 
      align="center" 
      justify="space-between" 
      wrap="wrap" 
      padding="1rem"
      bg="white"
      borderBottom="1px"
      borderColor="gray.200"
      width="100%"
    >
      <Flex align="center" mr={5}>
        <ChakraLink as={Link} to="/">
          <Text fontSize="lg" fontWeight="bold">
            SyncDesk
          </Text>
        </ChakraLink>
      </Flex>

      <Flex align="center" flex={1} justify="center" gap={2}>
        {getMainItems().map(item => (
          item.type === 'dropdown' ? (
            <Menu key={item.id}>
              <MenuButton
                as={Button}
                rightIcon={<ChevronDownIcon />}
                variant="ghost"
                _hover={{ bg: 'gray.100' }}
                _active={{ bg: 'gray.200' }}
              >
                {item.title}
              </MenuButton>
              <MenuList>
                {getDropdownItems(item.id).map(subItem => (
                  <MenuItem
                    key={subItem.id}
                    as={Link}
                    to={subItem.path || '#'}
                    bg={location.pathname === subItem.path ? 'gray.100' : 'transparent'}
                  >
                    {subItem.title}
                  </MenuItem>
                ))}
              </MenuList>
            </Menu>
          ) : (
            <Button
              key={item.id}
              as={Link}
              to={item.path || '#'}
              variant="ghost"
              colorScheme={location.pathname === item.path ? 'blue' : 'gray'}
              _hover={{ bg: 'gray.100' }}
            >
              {item.title}
            </Button>
          )
        ))}
      </Flex>

      <Flex align="center">
        <Menu>
          <MenuButton
            as={Button}
            rounded="full"
            variant="link"
            cursor="pointer"
            minW={0}
          >
            <Avatar
              size="sm"
              name={appUser?.full_name || 'User'}
              bg="yellow.400"
              color="black"
            />
          </MenuButton>
          <MenuList>
            <MenuItem onClick={() => supabase.auth.signOut()}>
              Sair
            </MenuItem>
          </MenuList>
        </Menu>
      </Flex>
    </Flex>
  );
} 