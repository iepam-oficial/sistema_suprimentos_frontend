import type { ReportSlug } from './types';

export interface ReportCatalogItem {
  slug: ReportSlug;
  title: string;
  description: string;
  group: string;
}

export const REPORT_CATALOG: ReportCatalogItem[] = [
  {
    slug: 'executive-summary',
    title: 'Resumo executivo',
    description: 'KPIs consolidados de inventário, OS, alertas e suprimentos',
    group: 'Geral',
  },
  {
    slug: 'inventory-overview',
    title: 'Inventário por local e categoria',
    description: 'Quantidade e valor patrimonial agrupados',
    group: 'Inventário',
  },
  {
    slug: 'supplies-stock',
    title: 'Estoque de suprimentos',
    description: 'Itens em estoque e abaixo do mínimo',
    group: 'Suprimentos',
  },
  {
    slug: 'consumption-by-sector',
    title: 'Consumo por setor',
    description: 'Saídas de suprimentos no período',
    group: 'Suprimentos',
  },
  {
    slug: 'purchases-by-batch',
    title: 'Compras por lote',
    description: 'Lotes de compra por fornecedor',
    group: 'Compras',
  },
  {
    slug: 'service-orders',
    title: 'Ordens de serviço',
    description: 'OS por mês e custo total',
    group: 'OS e Manutenção',
  },
  {
    slug: 'alerts-by-level',
    title: 'Alertas por nível',
    description: 'Distribuição por gravidade',
    group: 'Alertas',
  },
  {
    slug: 'supply-requests',
    title: 'Requisições',
    description: 'Pendentes e atrasadas',
    group: 'Suprimentos',
  },
];
