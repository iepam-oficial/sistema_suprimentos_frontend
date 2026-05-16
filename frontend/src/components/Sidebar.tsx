'use client';

import {
  Box,
  Drawer,
  DrawerContent,
  useDisclosure,
  VStack,
  IconButton,
  HStack,
  useBreakpointValue,
  Button,
  useColorModeValue,
  Collapse,
  useColorMode,
  Input,
  InputGroup,
  InputLeftElement,
  Flex,
  Text,
  Avatar,
} from '@chakra-ui/react';
import {
  Menu as MenuIcon,
  X,
  Home,
  Wrench,
  Settings,
  LogOut,
  Bell,
  Calendar,
  BarChart,
  Package,
  ShoppingCart,
  Timer,
  FileText,
  ChevronDown,
  ChevronRight,
  SearchIcon,
  Headphones,
  LayoutGrid,
  PlusCircle,
  LucideIcon,
} from 'lucide-react';
import NextImage from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import { useState } from 'react';
import { useUser, useFilters } from '@/contexts/GlobalContext';
import { useLogout } from '@/hooks/useLogout';
import { canCreateSupportTicket } from '@/app/(dashboard)/support-tickets/types';

const SIDEBAR_WIDTH = 256;

const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Administrador',
  MANAGER: 'Gerente',
  TECHNICIAN: 'Técnico',
  EMPLOYEE: 'Colaborador',
  ORGANIZER: 'Organizador',
  SUPPORT: 'Suporte',
};

function SidebarNavButton({
  icon: Icon,
  label,
  isActive,
  onClick,
  size = 'md',
}: {
  icon: LucideIcon;
  label: string;
  isActive: boolean;
  onClick: () => void;
  size?: 'sm' | 'md';
}) {
  const activeBg = useColorModeValue('blue.50', 'blue.900');
  const activeColor = useColorModeValue('blue.700', 'blue.200');
  const inactiveColor = useColorModeValue('gray.600', 'gray.300');
  const hoverBg = useColorModeValue('gray.50', 'whiteAlpha.100');

  return (
    <Button
      variant="ghost"
      w="full"
      justifyContent="flex-start"
      h="auto"
      py={2.5}
      px={3}
      fontSize="sm"
      fontWeight="medium"
      borderRadius="lg"
      leftIcon={
        <Box as="span" w={6} display="inline-flex" justifyContent="center" flexShrink={0}>
          <Icon size={18} />
        </Box>
      }
      size={size}
      bg={isActive ? activeBg : 'transparent'}
      color={isActive ? activeColor : inactiveColor}
      _hover={{ bg: isActive ? activeBg : hoverBg }}
      onClick={onClick}
    >
      {label}
    </Button>
  );
}

const SidebarContent = ({ onClose }: { onClose: () => void }) => {
  const router = useRouter();
  const pathname = usePathname() || '';
  const isMobile = useBreakpointValue({ base: true, md: false });
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const headerBorder = useColorModeValue('gray.100', 'gray.700');
  const mutedText = useColorModeValue('gray.500', 'gray.400');
  const activeBg = useColorModeValue('blue.50', 'blue.900');
  const activeColor = useColorModeValue('blue.700', 'blue.200');
  const inactiveColor = useColorModeValue('gray.600', 'gray.300');
  const hoverBg = useColorModeValue('gray.50', 'whiteAlpha.100');
  const { user } = useUser();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const { colorMode } = useColorMode();
  const { logout: handleLogout } = useLogout();

  const isMenuItemActive = (href: string) => {
    if (href === '/maintenance-schedules') return pathname.startsWith('/maintenance-schedules');
    if (href === '/support-tickets') {
      return pathname === '/support-tickets' || pathname.startsWith('/support-tickets/');
    }
    return pathname === href;
  };

  const handleNavigation = (href: string) => {
    router.push(href);
    if (isMobile) onClose();
  };

  const isEmployee = user?.role === 'EMPLOYEE';
  const isAdmin = user?.role === 'ADMIN';
  const showTicketsSubmenu =
    !!user &&
    canCreateSupportTicket(user.role) &&
    pathname.startsWith('/support-tickets');

  const menuItems: { icon: LucideIcon; label: string; href: string }[] = [
    ...(user && ['ADMIN', 'MANAGER'].includes(user.role)
      ? [{ icon: Home, label: 'Dashboard', href: '/dashboard' }]
      : []),
    ...(user &&
    ['EMPLOYEE', 'ORGANIZER', 'SUPPORT', 'ADMIN', 'MANAGER', 'TECHNICIAN'].includes(user.role)
      ? [{ icon: Headphones, label: 'Chamados', href: '/support-tickets' }]
      : []),
    ...(user && ['ADMIN', 'MANAGER'].includes(user.role)
      ? [{ icon: Wrench, label: 'OS Externas', href: '/orders' }]
      : []),
    ...(user?.role === 'TECHNICIAN'
      ? [{ icon: Wrench, label: 'OS Internas', href: '/internal-service-orders' }]
      : []),
    ...(user?.role === 'TECHNICIAN'
      ? [{ icon: Settings, label: 'Manutenção', href: '/maintenance-schedules' }]
      : []),
    ...(user?.role === 'MANAGER' ? [{ icon: Package, label: 'Inventário', href: '/inventory' }] : []),
    ...(user && ['ADMIN', 'MANAGER'].includes(user.role)
      ? [{ icon: Package, label: 'Suprimentos', href: '/supplies' }]
      : []),
    ...(user && ['ADMIN', 'MANAGER'].includes(user.role)
      ? [{ icon: Package, label: 'Requisições', href: '/supply-requests/admin' }]
      : []),
    ...(user && ['EMPLOYEE', 'ORGANIZER', 'TECHNICIAN'].includes(user.role)
      ? [{ icon: ShoppingCart, label: 'Requisições', href: '/supply-requests' }]
      : []),
    { icon: FileText, label: 'Cotações', href: '/quotes' },
    ...(user && ['ADMIN', 'MANAGER'].includes(user.role)
      ? [{ icon: Timer, label: 'Gastos Extras', href: '/extra-expenses' }]
      : []),
    ...(user && ['ADMIN', 'MANAGER', 'SUPPORT'].includes(user.role)
      ? [{ icon: Bell, label: 'Alertas', href: '/alerts' }]
      : []),
    { icon: Calendar, label: 'Eventos', href: '/events' },
    ...(user && ['ADMIN', 'MANAGER'].includes(user.role)
      ? [{ icon: BarChart, label: 'Relatórios', href: '/reports' }]
      : []),
  ];

  const settingsItems = [
    { label: 'Tema', href: '/settings/theme' },
    { label: 'Segurança', href: '/settings/security' },
    ...(!isEmployee ? [{ label: 'Unidades de Medida', href: '/settings/unit-of-measures' }] : []),
    ...(!isEmployee ? [{ label: 'Categorias', href: '/settings/categories' }] : []),
    ...(!isEmployee ? [{ label: 'Polos', href: '/settings/branches' }] : []),
    ...(!isEmployee ? [{ label: 'Ambientes', href: '/settings/enviroments' }] : []),
    ...(!isEmployee ? [{ label: 'Setores', href: '/settings/sectors' }] : []),
    ...(!isEmployee ? [{ label: 'Fornecedores', href: '/settings/suppliers' }] : []),
    ...(!isEmployee ? [{ label: 'Planos de Conta', href: '/chart-of-accounts' }] : []),
    ...(isAdmin ? [{ label: 'Usuários', href: '/settings/users' }] : []),
  ];

  return (
    <Flex
      direction="column"
      h="full"
      w="full"
      bg={bgColor}
      borderRight="1px"
      borderColor={borderColor}
      boxShadow="sm"
    >
      <HStack
        h="64px"
        px={4}
        borderBottom="1px"
        borderColor={headerBorder}
        flexShrink={0}
        justify="space-between"
      >
        <HStack spacing={3} flex={1} minW={0}>
          <Box
            position="relative"
            h="40px"
            w="40px"
            flexShrink={0}
            display={{ base: 'none', sm: 'block' }}
          >
            <NextImage
              src="/logo%20IEPAM%20.png"
              alt="IEPAM"
              fill
              sizes="40px"
              style={{ objectFit: 'contain' }}
              priority
            />
          </Box>
          <Box color="blue.600" flexShrink={0}>
            <Headphones size={22} />
          </Box>
          <Text fontWeight="bold" fontSize="md" letterSpacing="tight" noOfLines={1}>
            TI Assistant
          </Text>
        </HStack>
        {isMobile && (
          <IconButton aria-label="Fechar menu" icon={<X size={20} />} variant="ghost" onClick={onClose} />
        )}
      </HStack>

      <Box flex={1} overflowY="auto" p={4} css={{
        '&::-webkit-scrollbar': { width: '8px' },
        '&::-webkit-scrollbar-thumb': {
          background: colorMode === 'dark' ? '#4a5568' : '#cbd5e1',
          borderRadius: '4px',
        },
      }}>
        <VStack spacing={1} align="stretch">
          {menuItems.map((item) => (
            <Box key={item.href}>
              <SidebarNavButton
                icon={item.icon}
                label={item.label}
                isActive={
                  item.href === '/support-tickets'
                    ? pathname.startsWith('/support-tickets')
                    : isMenuItemActive(item.href)
                }
                onClick={() => handleNavigation(item.href)}
              />
              {item.href === '/support-tickets' && showTicketsSubmenu && (
                <VStack align="stretch" spacing={0.5} pl={9} mt={1} mb={1}>
                  <SidebarNavButton
                    icon={LayoutGrid}
                    label="Painel"
                    size="sm"
                    isActive={pathname === '/support-tickets'}
                    onClick={() => handleNavigation('/support-tickets')}
                  />
                  <SidebarNavButton
                    icon={PlusCircle}
                    label="Novo chamado"
                    size="sm"
                    isActive={pathname === '/support-tickets/new'}
                    onClick={() => handleNavigation('/support-tickets/new')}
                  />
                </VStack>
              )}
            </Box>
          ))}

          <Button
            variant="ghost"
            w="full"
            justifyContent="space-between"
            h="auto"
            py={2.5}
            px={3}
            fontSize="sm"
            fontWeight="medium"
            borderRadius="lg"
            leftIcon={
              <Box as="span" w={6} display="inline-flex" justifyContent="center">
                <Settings size={18} />
              </Box>
            }
            rightIcon={isSettingsOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
            bg={
              pathname.startsWith('/settings') || pathname === '/chart-of-accounts' ? activeBg : 'transparent'
            }
            color={
              pathname.startsWith('/settings') || pathname === '/chart-of-accounts' ? activeColor : inactiveColor
            }
            _hover={{ bg: hoverBg }}
            onClick={() => setIsSettingsOpen(!isSettingsOpen)}
          >
            Configurações
          </Button>

          <Collapse in={isSettingsOpen} style={{ width: '100%' }}>
            <Box maxH="200px" overflowY="auto" pl={4} mt={1}>
              <VStack spacing={0.5} align="stretch">
                {settingsItems.map((item) => (
                  <SidebarNavButton
                    key={item.href}
                    icon={ChevronRight}
                    label={item.label}
                    size="sm"
                    isActive={pathname === item.href}
                    onClick={() => handleNavigation(item.href)}
                  />
                ))}
              </VStack>
            </Box>
          </Collapse>
        </VStack>
      </Box>

      <Box borderTop="1px" borderColor={headerBorder} p={4} flexShrink={0}>
        {user && (
          <HStack spacing={3} mb={3}>
            <Avatar size="sm" name={user.name} bg="blue.100" color="blue.700" />
            <Box minW={0}>
              <Text fontSize="sm" fontWeight="medium" noOfLines={1}>
                {user.name}
              </Text>
              <Text fontSize="xs" color={mutedText} noOfLines={1}>
                {ROLE_LABELS[user.role] ?? user.role}
              </Text>
            </Box>
          </HStack>
        )}
        <Button
          variant="ghost"
          w="full"
          justifyContent="flex-start"
          leftIcon={<LogOut size={18} />}
          colorScheme="red"
          onClick={handleLogout}
          size="sm"
          borderRadius="lg"
          fontSize="sm"
          fontWeight="medium"
        >
          Sair
        </Button>
      </Box>
    </Flex>
  );
};

const MobileNav = ({ onOpen }: { onOpen: () => void }) => {
  const pathname = usePathname() || '';
  const { searchQuery, setSearchQuery } = useFilters();
  const { colorMode } = useColorMode();
  const showSearch = pathname === '/supply-requests';

  return (
    <Box
      position="fixed"
      top={0}
      left={0}
      right={0}
      zIndex={20}
      bg={useColorModeValue('white', 'gray.800')}
      borderBottom="1px"
      borderColor={useColorModeValue('gray.200', 'gray.700')}
      p={2}
    >
      <HStack justify="space-between" w="full" spacing={2}>
        <IconButton
          aria-label="Abrir menu"
          icon={<MenuIcon size={20} />}
          variant="ghost"
          onClick={onOpen}
          flexShrink={0}
        />
        {showSearch && (
          <InputGroup size="sm" flex="1">
            <InputLeftElement pointerEvents="none">
              <SearchIcon size={16} />
            </InputLeftElement>
            <Input
              placeholder="Buscar suprimentos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              bg={colorMode === 'dark' ? 'rgba(45, 55, 72, 0.5)' : 'gray.50'}
            />
          </InputGroup>
        )}
      </HStack>
    </Box>
  );
};

export default function Sidebar({ children }: { children: React.ReactNode }) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const isMobile = useBreakpointValue({ base: true, md: false });

  return (
    <Box minH="100vh" w="full" overflow="hidden">
      {isMobile && <MobileNav onOpen={onOpen} />}

      {isMobile ? (
        <Drawer
          autoFocus={false}
          isOpen={isOpen}
          placement="left"
          onClose={onClose}
          returnFocusOnClose={false}
          onOverlayClick={onClose}
          size="xs"
        >
          <DrawerContent maxW={`${SIDEBAR_WIDTH}px`}>
            <SidebarContent onClose={onClose} />
          </DrawerContent>
        </Drawer>
      ) : (
        <Box position="fixed" left={0} top={0} h="100vh" w={`${SIDEBAR_WIDTH}px`}>
          <SidebarContent onClose={onClose} />
        </Box>
      )}

      <Box ml={isMobile ? 0 : `${SIDEBAR_WIDTH}px`} pt={isMobile ? 12 : 0} p={0}>
        {children}
      </Box>
    </Box>
  );
};
