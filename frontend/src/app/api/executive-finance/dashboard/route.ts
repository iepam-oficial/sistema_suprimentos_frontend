import { createProxyHandler } from '@/lib/bff/createProxyHandler';

const handler = createProxyHandler('/executive-finance/dashboard');

export const GET = handler.GET;
