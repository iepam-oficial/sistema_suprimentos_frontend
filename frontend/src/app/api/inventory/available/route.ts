import { createProxyHandler } from '@/lib/bff/createProxyHandler';

const handler = createProxyHandler('/inventory/available');

export const GET = handler.GET;
