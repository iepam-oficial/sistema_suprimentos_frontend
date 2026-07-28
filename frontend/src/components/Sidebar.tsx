'use client';

import { useState } from 'react';
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
  TrendingDown,
  Barcode,
  LucideIcon,
} from 'lucide-react';
import { Box, Drawer, DrawerContent, useBreakpointValue, useDisclosure } from '@chakra-ui/react';
import { useUser, useFilters } from '@/contexts/GlobalContext';
import { useLogout } from '@/hooks/useLogout';
import { hasEmployeeSelfServiceAccess } from '@ti-assistant/contracts';
import { canCreateSupportTicket } from '@/features/support-tickets/types';
import { useProcurementMenuBadges } from '@/features/procurement';
import { formatBadgeCount } from '@/features/procurement/utils/menuBadgeFormat';
import {
  MENU_BADGE_PATH_BY_ROUTE,
  type MenuBadgeRouteKey,
} from '@/features/procurement/utils/menuBadgeRoutes';
import { cn } from '@/components/support-desk/cn';
import {
  CLOSE_DELAY_MS,
  useSidebarHover,
  type FlyoutGroupId,
} from '@/components/useSidebarHover';

/** Mobile drawer width (unchanged). */
const SIDEBAR_WIDTH = 256;
/** Desktop layout reserve + collapsed rail. */
const RAIL_WIDTH = 64;
const EXPANDED_WIDTH = 256;
const FLYOUT_WIDTH = 240;

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

type NavItem = { icon: LucideIcon; label: string; href: string };
type SettingsItem = { label: string; href: string };

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
  badgeLabel,
}: {
  icon: LucideIcon;
  label: string;
  isActive: boolean;
  onClick: () => void;
  size?: 'sm' | 'md';
  badgeLabel?: string;
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
      <span className="ml-2 min-w-0 flex-1 truncate text-left">{label}</span>
      {badgeLabel ? (
        <span
          className="ml-2 inline-flex h-[1.125rem] min-w-[1.125rem] shrink-0 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold leading-none text-white"
          aria-label={`${badgeLabel} atualizações`}
        >
          {badgeLabel}
        </span>
      ) : null}
    </button>
  );
}

function useSidebarMenuModel() {
  const pathname = usePathname() || '';
  const { user } = useUser();
  const { getCount } = useProcurementMenuBadges();

  const badgeForHref = (href: string): string => {
    const entry = Object.entries(MENU_BADGE_PATH_BY_ROUTE).find(([, path]) => path === href);
    if (!entry) return '';
    return formatBadgeCount(getCount(entry[0] as MenuBadgeRouteKey));
  };

  const comprasBadgeSum = formatBadgeCount(
    getCount('fila-compras') + getCount('cotacoes') + getCount('pedidos'),
  );

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
    if (href === '/depreciation-rates') return pathname.startsWith('/depreciation-rates');
    if (href === '/fiscal-codes') return pathname.startsWith('/fiscal-codes');
    return pathname === href;
  };

  const menuItems: NavItem[] = [
    ...(user && ['ADMIN', 'MANAGER'].includes(user.role)
      ? [{ icon: Home, label: 'Dashboard', href: '/dashboard' }]
      : []),
  ];

  const estoqueItems: NavItem[] = [
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
  ];

  const operacoesItems: NavItem[] = [
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
    { icon: Calendar, label: 'Eventos', href: '/events' },
    ...(user && ['ADMIN', 'MANAGER', 'SUPPORT'].includes(user.role)
      ? [{ icon: Bell, label: 'Alertas', href: '/alerts' }]
      : []),
  ];

  const financeiroItems: NavItem[] = [
    ...(user && ['ADMIN', 'MANAGER'].includes(user.role)
      ? [{ icon: Timer, label: 'Gastos Extras', href: '/extra-expenses' }]
      : []),
    ...(user && ['ADMIN', 'MANAGER'].includes(user.role)
      ? [{ icon: TrendingDown, label: 'Taxas de Depreciação', href: '/depreciation-rates' }]
      : []),
    ...(user && ['ADMIN', 'MANAGER'].includes(user.role)
      ? [{ icon: Barcode, label: 'Códigos Fiscais', href: '/fiscal-codes' }]
      : []),
    ...(user && ['ADMIN', 'MANAGER'].includes(user.role)
      ? [{ icon: BarChart, label: 'Relatórios', href: '/reports' }]
      : []),
  ];

  const settingsItems: SettingsItem[] = [
    { label: 'Tema', href: '/settings/theme' },
    { label: 'Segurança', href: '/settings/security' },
    ...(!isEmployee ? [{ label: 'Unidades de Medida', href: '/settings/unit-of-measures' }] : []),
    ...(user && ['ADMIN', 'MANAGER'].includes(user.role)
      ? [{ label: 'Formas de pagamento', href: '/settings/payment-methods' }]
      : []),
    ...(!isEmployee ? [{ label: 'Categorias', href: '/settings/categories' }] : []),
    ...(!isEmployee ? [{ label: 'Polos', href: '/settings/branches' }] : []),
    ...(!isEmployee ? [{ label: 'Ambientes', href: '/settings/enviroments' }] : []),
    ...(!isEmployee ? [{ label: 'Setores', href: '/settings/sectors' }] : []),
    ...(!isEmployee ? [{ label: 'Fornecedores', href: '/settings/suppliers' }] : []),
    ...(!isEmployee ? [{ label: 'Planos de Conta', href: '/chart-of-accounts' }] : []),
    ...(isAdmin ? [{ label: 'Usuários', href: '/settings/users' }] : []),
    ...(isAdmin ? [{ label: 'Códigos internos', href: '/settings/catalog-codes' }] : []),
  ];

  const comprasItems: NavItem[] = [
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
  ];

  const estoqueActive = estoqueItems.some((item) => isMenuItemActive(item.href));
  const operacoesActive = operacoesItems.some((item) => isMenuItemActive(item.href));
  const financeiroActive = financeiroItems.some((item) => isMenuItemActive(item.href));
  const comprasActive =
    pathname.startsWith('/procurement/solicitacoes') ||
    pathname.startsWith('/procurement/aprovacoes-sc') ||
    pathname.startsWith('/procurement/fila-compras') ||
    pathname.startsWith('/procurement/cotacoes') ||
    pathname.startsWith('/procurement/pedidos');
  const settingsActive = pathname.startsWith('/settings') || pathname === '/chart-of-accounts';

  return {
    user,
    pathname,
    menuItems,
    estoqueItems,
    operacoesItems,
    financeiroItems,
    settingsItems,
    comprasItems,
    estoqueActive,
    operacoesActive,
    financeiroActive,
    comprasActive,
    settingsActive,
    showTicketsSubmenu,
    isMenuItemActive,
    badgeForHref,
    comprasBadgeSum,
  };
}

function RailRow({
  icon: Icon,
  label,
  isActive,
  isExpanded,
  badgeLabel,
  onClick,
  onPointerEnter,
}: {
  icon: LucideIcon;
  label: string;
  isActive: boolean;
  isExpanded: boolean;
  badgeLabel?: string;
  onClick?: () => void;
  onPointerEnter?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      onPointerEnter={onPointerEnter}
      aria-label={label}
      className={cn(
        'relative flex w-full items-center rounded-lg font-medium transition-colors',
        isExpanded ? 'px-3 py-2.5 text-sm' : 'justify-center px-2 py-2.5',
        isActive
          ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-200'
          : 'text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-700/50',
      )}
    >
      <span className="relative flex w-6 shrink-0 justify-center">
        <Icon size={18} />
        {badgeLabel && !isExpanded ? (
          <span
            className="absolute -right-1.5 -top-1.5 inline-flex h-[1.125rem] min-w-[1.125rem] items-center justify-center rounded-full bg-red-500 px-0.5 text-[10px] font-semibold leading-none text-white"
            aria-label={`${badgeLabel} atualizações`}
          >
            {badgeLabel}
          </span>
        ) : null}
      </span>
      {isExpanded ? (
        <>
          <span className="ml-2 min-w-0 flex-1 truncate text-left">{label}</span>
          {badgeLabel ? (
            <span
              className="ml-2 inline-flex h-[1.125rem] min-w-[1.125rem] shrink-0 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold leading-none text-white"
              aria-label={`${badgeLabel} atualizações`}
            >
              {badgeLabel}
            </span>
          ) : null}
        </>
      ) : null}
    </button>
  );
}

function DesktopSidebarRail() {
  const router = useRouter();
  const { logout: handleLogout } = useLogout();
  const {
    user,
    pathname,
    menuItems,
    estoqueItems,
    operacoesItems,
    financeiroItems,
    settingsItems,
    comprasItems,
    estoqueActive,
    operacoesActive,
    financeiroActive,
    comprasActive,
    settingsActive,
    showTicketsSubmenu,
    isMenuItemActive,
    badgeForHref,
    comprasBadgeSum,
  } = useSidebarMenuModel();

  const { isExpanded, flyoutGroup, onShellEnter, onShellLeave, onGroupEnter, clearFlyout, collapseNow } =
    useSidebarHover(CLOSE_DELAY_MS);

  const handleNavigation = (href: string) => {
    collapseNow();
    router.push(href);
  };

  const groups: {
    id: FlyoutGroupId;
    label: string;
    icon: LucideIcon;
    items: NavItem[] | SettingsItem[];
    isActive: boolean;
    badgeLabel?: string;
    isSettings?: boolean;
  }[] = [
    ...(estoqueItems.length > 0
      ? [
          {
            id: 'estoque' as const,
            label: 'Estoque',
            icon: Package,
            items: estoqueItems,
            isActive: estoqueActive,
          },
        ]
      : []),
    ...(operacoesItems.length > 0
      ? [
          {
            id: 'operacoes' as const,
            label: 'Operações',
            icon: Wrench,
            items: operacoesItems,
            isActive: operacoesActive,
          },
        ]
      : []),
    ...(comprasItems.length > 0
      ? [
          {
            id: 'compras' as const,
            label: 'Compras',
            icon: ShoppingCart,
            items: comprasItems,
            isActive: comprasActive,
            badgeLabel: comprasBadgeSum || undefined,
          },
        ]
      : []),
    ...(financeiroItems.length > 0
      ? [
          {
            id: 'financeiro' as const,
            label: 'Financeiro',
            icon: BarChart,
            items: financeiroItems,
            isActive: financeiroActive,
          },
        ]
      : []),
    {
      id: 'configuracoes' as const,
      label: 'Configurações',
      icon: Settings,
      items: settingsItems,
      isActive: settingsActive,
      isSettings: true,
    },
  ];

  const activeFlyout = groups.find((g) => g.id === flyoutGroup);

  return (
    <aside
      className="fixed left-0 top-0 z-30 flex h-screen"
      onPointerEnter={onShellEnter}
      onPointerLeave={onShellLeave}
    >
      <div
        className={cn(
          'flex h-full shrink-0 flex-col border-r border-slate-200 bg-white shadow-sm transition-[width] duration-150 dark:border-slate-700 dark:bg-slate-800',
        )}
        style={{ width: isExpanded ? EXPANDED_WIDTH : RAIL_WIDTH }}
      >
        <div
          className={cn(
            'flex h-16 shrink-0 items-center border-b border-slate-100 dark:border-slate-700',
            isExpanded ? 'gap-3 px-4' : 'justify-center px-2',
          )}
        >
          {user ? (
            <>
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-100 text-sm font-bold text-primary-700 dark:bg-primary-900/50 dark:text-primary-200">
                {getInitials(user.name)}
              </div>
              {isExpanded ? (
                <div className="min-w-0 overflow-hidden">
                  <p className="truncate text-sm font-medium text-slate-700 dark:text-slate-200">
                    {user.name}
                  </p>
                  <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                    {ROLE_LABELS[user.role] ?? user.role}
                  </p>
                </div>
              ) : null}
            </>
          ) : null}
        </div>

        <nav className={cn('flex-1 space-y-1 overflow-y-auto scrollbar-thin', isExpanded ? 'p-3' : 'p-2')}>
          {menuItems.map((item) => (
            <RailRow
              key={item.href}
              icon={item.icon}
              label={item.label}
              isActive={isMenuItemActive(item.href)}
              isExpanded={isExpanded}
              onPointerEnter={clearFlyout}
              onClick={() => handleNavigation(item.href)}
            />
          ))}

          {groups.map((group) => (
            <RailRow
              key={group.id}
              icon={group.icon}
              label={group.label}
              isActive={group.isActive}
              isExpanded={isExpanded}
              badgeLabel={group.badgeLabel}
              onPointerEnter={() => onGroupEnter(group.id)}
              onClick={() => {
                /* group click is no-op — flyout opens on hover only */
              }}
            />
          ))}
        </nav>

        <div
          className={cn(
            'shrink-0 border-t border-slate-100 dark:border-slate-700',
            isExpanded ? 'p-3' : 'p-2',
          )}
        >
          <button
            type="button"
            onClick={handleLogout}
            aria-label="Sair"
            className={cn(
              'flex w-full items-center rounded-lg font-medium text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20',
              isExpanded ? 'px-3 py-2.5 text-sm' : 'justify-center px-2 py-2.5',
            )}
          >
            <LogOut className="h-[18px] w-[18px] shrink-0" />
            {isExpanded ? <span className="ml-2">Sair</span> : null}
          </button>
        </div>
      </div>

      {isExpanded && activeFlyout ? (
        <div
          className="flex h-full shrink-0 flex-col border-r border-slate-200 bg-white shadow-md dark:border-slate-700 dark:bg-slate-800"
          style={{ width: FLYOUT_WIDTH }}
        >
          <div className="flex h-16 shrink-0 items-center border-b border-slate-100 px-4 dark:border-slate-700">
            <p className="truncate text-sm font-semibold text-slate-700 dark:text-slate-200">
              {activeFlyout.label}
            </p>
          </div>
          <nav className="flex-1 space-y-0.5 overflow-y-auto p-3 scrollbar-thin">
            {activeFlyout.isSettings
              ? (activeFlyout.items as SettingsItem[]).map((item) => (
                  <SidebarNavLink
                    key={item.href}
                    icon={ChevronRight}
                    label={item.label}
                    size="sm"
                    isActive={pathname === item.href}
                    onClick={() => handleNavigation(item.href)}
                  />
                ))
              : (activeFlyout.items as NavItem[]).map((item) => (
                  <div key={item.href}>
                    <SidebarNavLink
                      icon={item.icon}
                      label={item.label}
                      size="sm"
                      isActive={isMenuItemActive(item.href)}
                      onClick={() => handleNavigation(item.href)}
                      badgeLabel={
                        activeFlyout.id === 'compras'
                          ? badgeForHref(item.href) || undefined
                          : undefined
                      }
                    />
                    {activeFlyout.id === 'operacoes' &&
                      item.href === '/support-tickets' &&
                      showTicketsSubmenu && (
                        <div className="mb-1 mt-1 space-y-0.5 pl-5">
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
          </nav>
        </div>
      ) : null}
    </aside>
  );
}

/** Mobile accordion sidebar — behavior preserved from pre-rail feature. */
function SidebarContent({ onClose, isMobile }: { onClose: () => void; isMobile: boolean }) {
  const router = useRouter();
  const [isEstoqueOpen, setIsEstoqueOpen] = useState(false);
  const [isOperacoesOpen, setIsOperacoesOpen] = useState(false);
  const [isComprasOpen, setIsComprasOpen] = useState(false);
  const [isFinanceiroOpen, setIsFinanceiroOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const { logout: handleLogout } = useLogout();
  const {
    user,
    pathname,
    menuItems,
    estoqueItems,
    operacoesItems,
    financeiroItems,
    settingsItems,
    comprasItems,
    estoqueActive,
    operacoesActive,
    financeiroActive,
    comprasActive,
    settingsActive,
    showTicketsSubmenu,
    isMenuItemActive,
    badgeForHref,
    comprasBadgeSum,
  } = useSidebarMenuModel();

  const comprasBadgeLabel = isComprasOpen ? '' : comprasBadgeSum;

  const handleNavigation = (href: string) => {
    router.push(href);
    if (isMobile) onClose();
  };

  const renderGroupToggle = ({
    label,
    icon: Icon,
    isOpen,
    isActive,
    onToggle,
    badgeLabel,
  }: {
    label: string;
    icon: LucideIcon;
    isOpen: boolean;
    isActive: boolean;
    onToggle: () => void;
    badgeLabel?: string;
  }) => (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        'flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
        isActive
          ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-200'
          : 'text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-700/50',
      )}
    >
      <span className="flex items-center">
        <span className="flex w-6 justify-center">
          <Icon className="h-[18px] w-[18px]" />
        </span>
        <span className="ml-2">{label}</span>
      </span>
      <span className="flex items-center gap-2">
        {badgeLabel ? (
          <span
            className="inline-flex h-[1.125rem] min-w-[1.125rem] shrink-0 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold leading-none text-white"
            aria-label={`${badgeLabel} atualizações`}
          >
            {badgeLabel}
          </span>
        ) : null}
        {isOpen ? (
          <ChevronDown className="h-4 w-4 shrink-0" />
        ) : (
          <ChevronRight className="h-4 w-4 shrink-0" />
        )}
      </span>
    </button>
  );

  return (
    <aside className="flex h-full w-full flex-col border-r border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
      <div className="flex h-16 shrink-0 items-center justify-between gap-2 border-b border-slate-100 px-4 dark:border-slate-700">
        {user ? (
          <div className="flex min-w-0 flex-1 items-center gap-3">
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
        ) : (
          <div className="min-w-0 flex-1" />
        )}
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
          <SidebarNavLink
            key={item.href}
            icon={item.icon}
            label={item.label}
            isActive={isMenuItemActive(item.href)}
            onClick={() => handleNavigation(item.href)}
          />
        ))}

        {estoqueItems.length > 0 && (
          <>
            {renderGroupToggle({
              label: 'Estoque',
              icon: Package,
              isOpen: isEstoqueOpen,
              isActive: estoqueActive,
              onToggle: () => setIsEstoqueOpen(!isEstoqueOpen),
            })}
            {isEstoqueOpen && (
              <div className="mt-1 space-y-0.5 pl-4">
                {estoqueItems.map((item) => (
                  <SidebarNavLink
                    key={item.href}
                    icon={item.icon}
                    label={item.label}
                    size="sm"
                    isActive={isMenuItemActive(item.href)}
                    onClick={() => handleNavigation(item.href)}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {operacoesItems.length > 0 && (
          <>
            {renderGroupToggle({
              label: 'Operações',
              icon: Wrench,
              isOpen: isOperacoesOpen,
              isActive: operacoesActive,
              onToggle: () => setIsOperacoesOpen(!isOperacoesOpen),
            })}
            {isOperacoesOpen && (
              <div className="mt-1 space-y-0.5 pl-4">
                {operacoesItems.map((item) => (
                  <div key={item.href}>
                    <SidebarNavLink
                      icon={item.icon}
                      label={item.label}
                      size="sm"
                      isActive={isMenuItemActive(item.href)}
                      onClick={() => handleNavigation(item.href)}
                    />
                    {item.href === '/support-tickets' && showTicketsSubmenu && (
                      <div className="mb-1 mt-1 space-y-0.5 pl-5">
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
              </div>
            )}
          </>
        )}

        {comprasItems.length > 0 && (
          <>
            {renderGroupToggle({
              label: 'Compras',
              icon: ShoppingCart,
              isOpen: isComprasOpen,
              isActive: comprasActive,
              onToggle: () => setIsComprasOpen(!isComprasOpen),
              badgeLabel: comprasBadgeLabel || undefined,
            })}
            {isComprasOpen && (
              <div className="mt-1 space-y-0.5 pl-4">
                {comprasItems.map((item) => (
                  <SidebarNavLink
                    key={item.href}
                    icon={item.icon}
                    label={item.label}
                    size="sm"
                    isActive={isMenuItemActive(item.href)}
                    onClick={() => handleNavigation(item.href)}
                    badgeLabel={badgeForHref(item.href) || undefined}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {financeiroItems.length > 0 && (
          <>
            {renderGroupToggle({
              label: 'Financeiro',
              icon: BarChart,
              isOpen: isFinanceiroOpen,
              isActive: financeiroActive,
              onToggle: () => setIsFinanceiroOpen(!isFinanceiroOpen),
            })}
            {isFinanceiroOpen && (
              <div className="mt-1 space-y-0.5 pl-4">
                {financeiroItems.map((item) => (
                  <SidebarNavLink
                    key={item.href}
                    icon={item.icon}
                    label={item.label}
                    size="sm"
                    isActive={isMenuItemActive(item.href)}
                    onClick={() => handleNavigation(item.href)}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {renderGroupToggle({
          label: 'Configurações',
          icon: Settings,
          isOpen: isSettingsOpen,
          isActive: settingsActive,
          onToggle: () => setIsSettingsOpen(!isSettingsOpen),
        })}
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
        <DesktopSidebarRail />
      )}

      <Box as="main" ml={isMobile ? 0 : `${RAIL_WIDTH}px`} pt={isMobile ? 12 : 0}>
        {children}
      </Box>
    </Box>
  );
}
