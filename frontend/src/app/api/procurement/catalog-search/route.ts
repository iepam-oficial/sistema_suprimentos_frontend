import { createProxyHandler } from '@/lib/bff/createProxyHandler';

const handler = createProxyHandler('/procurement/catalog-search');

export const GET = handler.GET;
