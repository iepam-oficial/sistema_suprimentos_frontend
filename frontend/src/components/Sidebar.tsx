'use client';

import { useState } from 'react';
import NextImage from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
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
  Search,
  Headphones,
  LayoutGrid,
  PlusCircle,
  ClipboardList,
  CheckSquare,
  Scale,
  Receipt,
  ListOrdered,
  LucideIcon,
} from 'lucide-react';
import { Box, Drawer, DrawerContent, useBreakpointValue, useDisclosure } from '@chakra-ui/react';
import { useUser, useFilters } from '@/contexts/GlobalContext';
import { useLogout } from '@/hooks/useLogout';
import { hasEmployeeSelfServiceAccess } from '@ti-assistant/contracts';
import { canCreateSupportTicket } from '@/features/support-tickets/types';
import { cn } from '@/components/support-desk/cn';

const SIDEBAR_WIDTH = 256;

const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Administrador',
  MANAGER: 'Gerente',
  TECHNICIAN: 'Técnico',
  EMPLOYEE: 'Colaborador',
  ORGANIZER: 'Organizador',
  SUPPORT: 'Suporte',
  COORDINATOR: 'Coordenador',
  DIRECTOR: 'Diretor',
};

function getInitials(name?: string): string {
  if (!name?.trim()) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function SidebarNavLink({
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
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex w-full items-center rounded-lg font-medium transition-colors',
        size === 'sm' ? 'px-3 py-2 text-xs' : 'px-3 py-2.5 text-sm',
        isActive
          ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-200'
          : 'text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-700/50',
      )}
    >
      <span className="flex w-6 shrink-0 justify-center">
        <Icon size={size === 'sm' ? 16 : 18} />
      </span>
      <span className="ml-2 truncate text-left">{label}</span>
    </button>
  );
}

function SidebarContent({ onClose, isMobile }: { onClose: () => void; isMobile: boolean }) {
  const router = useRouter();
  const pathname = usePathname() || '';
  const { user } = useUser();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const { logout: handleLogout } = useLogout();

  const handleNavigation = (href: string) => {
    router.push(href);
    if (isMobile) onClose();
  };

  const isEmployee = user?.role === 'EMPLOYEE';
  const isAdmin = user?.role === 'ADMIN';
  const showTicketsSubmenu =
    !!user && canCreateSupportTicket(user.role) && pathname.startsWith('/support-tickets');

  const isMenuItemActive = (href: string) => {
    if (href === '/maintenance-schedules') return pathname.startsWith('/maintenance-schedules');
    if (href === '/support-tickets') return pathname.startsWith('/support-tickets');
    if (href === '/procurement/solicitacoes') return pathname.startsWith('/procurement/solicitacoes');
    if (href === '/procurement/aprovacoes-sc') return pathname.startsWith('/procurement/aprovacoes-sc');
    if (href === '/procurement/fila-compras') return pathname.startsWith('/procurement/fila-compras');
    if (href === '/procurement/cotacoes') return pathname.startsWith('/procurement/cotacoes');
    if (href === '/procurement/pedidos') return pathname.startsWith('/procurement/pedidos');
    return pathname === href;
  };

  const menuItems: { icon: LucideIcon; label: string; href: string }[] = [
    ...(user && ['ADMIN', 'MANAGER'].includes(user.role)
      ? [{ icon: Home, label: 'Dashboard', href: '/dashboard' }]
      : []),
    ...(user &&
    (hasEmployeeSelfServiceAccess(user.role) ||
      ['SUPPORT', 'ADMIN', 'MANAGER'].includes(user.role))
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
    ...(user && hasEmployeeSelfServiceAccess(user.role)
      ? [{ icon: ShoppingCart, label: 'Requisições', href: '/supply-requests' }]
      : []),
    ...(user && ['COORDINATOR', 'ADMIN'].includes(user.role)
      ? [{ icon: ClipboardList, label: 'Solicitações de Compra', href: '/procurement/solicitacoes' }]
      : []),
    ...(user && ['DIRECTOR', 'ADMIN'].includes(user.role)
      ? [{ icon: CheckSquare, label: 'Aprovações SC', href: '/procurement/aprovacoes-sc' }]
      : []),
    ...(user && ['MANAGER', 'ADMIN'].includes(user.role)
      ? [{ icon: ListOrdered, label: 'Fila de Compras', href: '/procurement/fila-compras' }]
      : []),
    ...(user && ['MANAGER', 'DIRECTOR', 'ADMIN'].includes(user.role)
      ? [{ icon: Scale, label: 'Cotações de Compras', href: '/procurement/cotacoes' }]
      : []),
    ...(user && ['MANAGER', 'ADMIN'].includes(user.role)
      ? [{ icon: Receipt, label: 'Pedidos de Compra', href: '/procurement/pedidos' }]
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

  const settingsActive =
    pathname.startsWith('/settings') || pathname === '/chart-of-accounts';

  return (
    <aside className="flex h-full w-full flex-col border-r border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-slate-100 px-4 dark:border-slate-700">
        <div className="flex min-w-0 flex-1 items-center">
          <div className="relative h-10 w-10 shrink-0">
            <NextImage
              src="/logo%20IEPAM%20.png"
              alt="IEPAM"
              fill
              sizes="40px"
              style={{ objectFit: 'contain' }}
              priority
            />
          </div>
        </div>
        {isMobile && (
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700"
            aria-label="Fechar menu"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-4 scrollbar-thin">
        {menuItems.map((item) => (
          <div key={item.href}>
            <SidebarNavLink
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
              <div className="mb-1 mt-1 space-y-0.5 pl-9">
                  <SidebarNavLink
                    icon={LayoutGrid}
                    label="Painel"
                    size="sm"
                    isActive={pathname === '/support-tickets'}
                    onClick={() => handleNavigation('/support-tickets')}
                  />
                  <SidebarNavLink
                    icon={PlusCircle}
                    label="Novo chamado"
                    size="sm"
                    isActive={pathname === '/support-tickets/new'}
                    onClick={() => handleNavigation('/support-tickets/new')}
                  />
                </div>
            )}
          </div>
        ))}

        <button
          type="button"
          onClick={() => setIsSettingsOpen(!isSettingsOpen)}
          className={cn(
            'flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
            settingsActive
              ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-200'
              : 'text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-700/50',
          )}
        >
          <span className="flex items-center">
            <span className="flex w-6 justify-center">
              <Settings className="h-[18px] w-[18px]" />
            </span>
            <span className="ml-2">Configurações</span>
          </span>
          {isSettingsOpen ? (
            <ChevronDown className="h-4 w-4 shrink-0" />
          ) : (
            <ChevronRight className="h-4 w-4 shrink-0" />
          )}
        </button>

        {isSettingsOpen && (
          <div className="mt-1 max-h-[200px] space-y-0.5 overflow-y-auto pl-4 scrollbar-thin">
            {settingsItems.map((item) => (
              <SidebarNavLink
                key={item.href}
                icon={ChevronRight}
                label={item.label}
                size="sm"
                isActive={pathname === item.href}
                onClick={() => handleNavigation(item.href)}
              />
            ))}
          </div>
        )}
      </nav>

      <div className="shrink-0 border-t border-slate-100 p-4 dark:border-slate-700">
        {user && (
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-100 text-sm font-bold text-primary-700 dark:bg-primary-900/50 dark:text-primary-200">
              {getInitials(user.name)}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-slate-700 dark:text-slate-200">{user.name}</p>
              <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                {ROLE_LABELS[user.role] ?? user.role}
              </p>
            </div>
          </div>
        )}
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center rounded-lg px-3 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
        >
          <LogOut className="mr-2 h-[18px] w-[18px]" />
          Sair
        </button>
      </div>
    </aside>
  );
}

function MobileNav({ onOpen }: { onOpen: () => void }) {
  const pathname = usePathname() || '';
  const { searchQuery, setSearchQuery } = useFilters();
  const showSearch = pathname === '/supply-requests';

  return (
    <header className="fixed left-0 right-0 top-0 z-20 border-b border-slate-200 bg-white p-2 dark:border-slate-700 dark:bg-slate-800 md:hidden">
      <div className="flex w-full items-center gap-2">
          <button
            type="button"
            onClick={onOpen}
            className="shrink-0 rounded-md p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300"
            aria-label="Abrir menu"
          >
            <MenuIcon className="h-5 w-5" />
          </button>
          {showSearch && (
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                placeholder="Buscar suprimentos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm dark:border-slate-600 dark:bg-slate-700"
              />
            </div>
          )}
        </div>
    </header>
  );
}

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
          <DrawerContent maxW={`${SIDEBAR_WIDTH}px`} p={0}>
            <SidebarContent onClose={onClose} isMobile />
          </DrawerContent>
        </Drawer>
      ) : (
        <Box position="fixed" left={0} top={0} h="100vh" w={`${SIDEBAR_WIDTH}px`} zIndex={30}>
          <SidebarContent onClose={onClose} isMobile={false} />
        </Box>
      )}

      <Box as="main" ml={isMobile ? 0 : `${SIDEBAR_WIDTH}px`} pt={isMobile ? 12 : 0}>
        {children}
      </Box>
    </Box>
  );
}
