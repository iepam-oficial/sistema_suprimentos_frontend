import { createProxyHandler } from '@/lib/bff/createProxyHandler';

const handler = createProxyHandler('/catalog-settings');

export const GET = handler.GET;
export const PUT = handler.PUT;
