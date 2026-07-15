import { createProxyHandler } from '@/lib/bff/createProxyHandler';

const handler = createProxyHandler('/reports/filters');

export const GET = handler.GET;
