import { createProxyHandler } from '@/lib/bff/createProxyHandler';

const handler = createProxyHandler('/inventory/form-data');

export const GET = handler.GET;
