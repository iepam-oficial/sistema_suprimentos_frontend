import { createProxyHandler } from '@/lib/bff/createProxyHandler';

const handler = createProxyHandler('/stock-movements');

export const GET = handler.GET;
