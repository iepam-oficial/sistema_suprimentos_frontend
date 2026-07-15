import { createProxyHandler } from '@/lib/bff/createProxyHandler';

const handler = createProxyHandler('/supplies/search');

export const GET = handler.GET;
