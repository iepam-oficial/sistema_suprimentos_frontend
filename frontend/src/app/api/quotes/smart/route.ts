import { createProxyHandler } from '@/lib/bff/createProxyHandler';

const handler = createProxyHandler('/quotes/smart');

export const GET = handler.GET;
