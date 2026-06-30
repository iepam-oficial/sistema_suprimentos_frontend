import { createProxyHandler } from '@/lib/bff/createProxyHandler';

const handler = createProxyHandler('/procurement/settings');

export const GET = handler.GET;
export const PUT = handler.PUT;
