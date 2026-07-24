import { createProxyHandler } from '@/lib/bff/createProxyHandler';

const handler = createProxyHandler('/demand-supplies');

export const GET = handler.GET;
