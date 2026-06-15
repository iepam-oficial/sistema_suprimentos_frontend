import { createProxyHandler } from '@/lib/bff/createProxyHandler';

const handler = createProxyHandler('/suppliers/search');

export const GET = handler.GET;
