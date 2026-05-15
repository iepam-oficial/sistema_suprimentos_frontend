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
  Link,
  useColorModeValue,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Collapse,
  useColorMode,
  Input,
  InputGroup,
  InputLeftElement,
} from '@chakra-ui/react'
import { Menu as MenuIcon, X, Home, Printer, Wrench, Box as BoxIcon, Settings, LogOut, Bell, Calendar, BarChart, Package, ShoppingCart, ArrowLeft, Timer, FileText, ChevronDown, ChevronRight, SearchIcon, Headphones } from 'lucide-react'
import NextLink from 'next/link'
import NextImage from 'next/image'
import { useRouter, usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { FiHome, FiMessageSquare, FiFileText, FiShoppingCart, FiPackage, FiUsers } from 'react-icons/fi'
import { useUser, useFilters } from '@/contexts/GlobalContext'
import { useLogout } from '@/hooks/useLogout'

interface SidebarProps {
  onClose: () => void
  isOpen: boolean
}

const SidebarContent = ({ onClose }: { onClose: () => void }) => {
  const router = useRouter()
  const pathname = usePathname() || ''
  const isMobile = useBreakpointValue({ base: true, md: false })
  const bgColor = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.700')
  const activeBgColor = useColorModeValue('blue.50', 'blue.900')
  const activeColor = useColorModeValue('blue.600', 'blue.200')
  const { user, isAuthenticated } = useUser()
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const { colorMode } = useColorMode()

  // Debug logs
  console.log('Sidebar - User:', user)
  console.log('Sidebar - isAuthenticated:', isAuthenticated)
  console.log('Sidebar - User role:', user?.role)

  const { logout: handleLogout } = useLogout()

  const isMenuItemActive = (href: string) => {
    if (href === '/maintenance-schedules') {
      return pathname.startsWith('/maintenance-schedules')
    }
    return pathname === href
  }

  const handleNavigation = (href: string) => {
    router.push(href)
    if (isMobile) {
      onClose()
    }
  }

  const isEmployee = user && user.role === 'EMPLOYEE'
  const isAdmin = user && user.role === 'ADMIN'

  console.log('Sidebar - isAdmin:', isAdmin)
  console.log('Sidebar - isEmployee:', isEmployee)

  const menuItems = [
    ...(user && ['ADMIN', 'MANAGER'].includes(user.role) ? [{ icon: Home, label: 'Dashboard', href: '/dashboard' }] : []),
    ...(user && ['EMPLOYEE', 'ORGANIZER', 'SUPPORT', 'ADMIN', 'MANAGER', 'TECHNICIAN'].includes(user.role)
      ? [{ icon: Headphones, label: 'Chamados', href: '/support-tickets' }]
      : []),
    ...(user && ['ADMIN', 'MANAGER'].includes(user.role) ? [{ icon: Wrench, label: 'OS Externas', href: '/orders' }] : []),
    ...(user && user.role === 'TECHNICIAN' ? [{ icon: Wrench, label: 'OS Internas', href: '/internal-service-orders' }] : []),
    ...(user && user.role === 'TECHNICIAN' ? [{ icon: Settings, label: 'Manutenção', href: '/maintenance-schedules' }] : []),
    ...(user && user.role === 'MANAGER' ? [{ icon: Package, label: 'Inventário', href: '/inventory' }] : []),
    ...(user && ['ADMIN', 'MANAGER'].includes(user.role) ? [{ icon: Package, label: 'Suprimentos', href: '/supplies' }] : []),
    ...(user && ['ADMIN', 'MANAGER'].includes(user.role) ? [{ icon: Package, label: 'Requisições', href: '/supply-requests/admin' }] : []),
    ...(user && ['EMPLOYEE', 'ORGANIZER', 'TECHNICIAN'].includes(user.role) ? [{ icon: ShoppingCart, label: 'Requisições', href: '/supply-requests' }] : []),
    { icon: FileText, label: 'Cotações', href: '/quotes' },
    ...(user && ['ADMIN', 'MANAGER'].includes(user.role) ? [{ icon: Timer, label: 'Gastos Extras', href: '/extra-expenses' }] : []),
    ...(user && ['ADMIN', 'MANAGER', 'SUPPORT'].includes(user.role) ? [{ icon: Bell, label: 'Alertas', href: '/alerts' }] : []),
    { icon: Calendar, label: 'Eventos', href: '/events' },
    ...(user && ['ADMIN', 'MANAGER'].includes(user.role) ? [{ icon: BarChart, label: 'Relatórios', href: '/reports' }] : []),
  ]

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
  ]

  return (
    <VStack
      h="full"
      w="full"
      spacing={4}
      align="stretch"
      bg={bgColor}
      borderRight="1px"
      borderColor={borderColor}
      p={4}
    >
      <HStack justify="space-between" mb={4} align="center" spacing={3}>
        <Box
          position="relative"
          h="88px"
          flex={1}
          minW={0}
        >
          <NextImage
            src="/logo%20IEPAM%20.png"
            alt="IEPAM"
            fill
            sizes="218px"
            style={{ objectFit: 'contain', objectPosition: 'left center' }}
            priority
          />
        </Box>
        {isMobile && (
          <IconButton
            aria-label="Fechar menu"
            icon={<X />}
            variant="ghost"
            onClick={onClose}
          />
        )}
      </HStack>

      <VStack spacing={2} align="stretch" flex={1} overflow="hidden">
        {menuItems.map((item) => (
          <Button
            key={item.href}
            variant="ghost"
            w="full"
            justifyContent="flex-start"
            leftIcon={<item.icon size={20} />}
            size={isMobile ? "sm" : "md"}
            bg={isMenuItemActive(item.href) ? activeBgColor : 'transparent'}
            color={isMenuItemActive(item.href) ? activeColor : 'inherit'}
            _hover={{
              bg: isMenuItemActive(item.href) ? activeBgColor : 'gray.100',
            }}
            onClick={() => handleNavigation(item.href)}
          >
            {item.label}
          </Button>
        ))}

        <Button
          variant="ghost"
          w="full"
          justifyContent="flex-start"
          leftIcon={<Settings size={20} />}
          rightIcon={isSettingsOpen ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
          size={isMobile ? "sm" : "md"}
          bg={pathname.startsWith('/settings') ? activeBgColor : 'transparent'}
          color={pathname.startsWith('/settings') ? activeColor : 'inherit'}
          _hover={{
            bg: pathname.startsWith('/settings') ? activeBgColor : 'gray.100',
          }}
          onClick={() => setIsSettingsOpen(!isSettingsOpen)}
        >
          Configurações
        </Button>

        <Collapse in={isSettingsOpen} style={{ width: '100%' }}>
          <Box
            maxH="200px"
            overflowY="auto"
            css={{
              '&::-webkit-scrollbar': {
                width: '4px',
              },
              '&::-webkit-scrollbar-track': {
                width: '6px',
                background: 'transparent',
              },
              '&::-webkit-scrollbar-thumb': {
                background: colorMode === 'dark' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)',
                borderRadius: '24px',
              },
            }}
          >
            <VStack spacing={1} align="stretch" pl={4}>
              {settingsItems.map((item) => (
                <Button
                  key={item.href}
                  variant="ghost"
                  w="full"
                  justifyContent="flex-start"
                  size={isMobile ? "sm" : "md"}
                  bg={pathname === item.href ? activeBgColor : 'transparent'}
                  color={pathname === item.href ? activeColor : 'inherit'}
                  _hover={{
                    bg: pathname === item.href ? activeBgColor : 'gray.100',
                  }}
                  onClick={() => handleNavigation(item.href)}
                >
                  {item.label}
                </Button>
              ))}
            </VStack>
          </Box>
        </Collapse>
      </VStack>

      <Box mt="auto">
        <Button
          variant="ghost"
          w="full"
          justifyContent="flex-start"
          leftIcon={<LogOut size={20} />}
          colorScheme="red"
          onClick={handleLogout}
          size={isMobile ? "sm" : "md"}
        >
          Sair
        </Button>
      </Box>
    </VStack>
  )
}

const MobileNav = ({ onOpen }: { onOpen: () => void }) => {
  const router = useRouter()
  const pathname = usePathname() || ''
  const { user } = useUser()
  const { searchQuery, setSearchQuery } = useFilters()
  const { colorMode } = useColorMode()

  const handleHistoryClick = () => {
    if (['ADMIN', 'MANAGER', 'ORGANIZER'].includes(user?.role || '')) {
      router.push('/supply-requests/history')
    } else {
      router.push('/supply-requests/my-requests')
    }
  }

  // Mostrar campo de busca apenas na página de supply-requests
  const showSearch = pathname === '/supply-requests'

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
            sx={{
              '& svg': {
                stroke: 'currentColor',
              }
            }}
          />
        
        {showSearch && (
          <InputGroup size="sm" flex="1">
            <InputLeftElement pointerEvents="none">
              <SearchIcon size={16} color={colorMode === 'dark' ? 'gray.400' : 'gray.300'} />
            </InputLeftElement>
            <Input
              placeholder="Buscar suprimentos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              bg={colorMode === 'dark' ? 'rgba(45, 55, 72, 0.5)' : 'gray.50'}
              backdropFilter="blur(12px)"
              borderColor={colorMode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}
              _hover={{ borderColor: colorMode === 'dark' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)' }}
              _focus={{ borderColor: colorMode === 'dark' ? 'blue.400' : 'blue.500', boxShadow: 'none' }}
            />
          </InputGroup>
        )}
      </HStack>
    </Box>
  )
}

export default function Sidebar({ children }: { children: React.ReactNode }) {
  const { isOpen, onOpen, onClose } = useDisclosure()
  const isMobile = useBreakpointValue({ base: true, md: false })

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
          size="full"
        >
          <DrawerContent>
            <SidebarContent onClose={onClose} />
          </DrawerContent>
        </Drawer>
      ) : (
        <Box
          position="fixed"
          left={0}
          top={0}
          h="100vh"
          w="250px"
        >
          <SidebarContent onClose={onClose} />
        </Box>
      )}

      <Box
        ml={isMobile ? 0 : 250} // 250px é a largura do sidebar
        pt={isMobile ? 12 : 0} // 12px é a altura do header do sidebar
        p={0} // 4px é o padding do conteúdo
      >
        {children}
      </Box>
    </Box>
  )
} 