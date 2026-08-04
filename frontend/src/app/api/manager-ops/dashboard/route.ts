import { createProxyHandler } from '@/lib/bff/createProxyHandler';

const handler = createProxyHandler('/manager-ops/dashboard');

export const GET = handler.GET;
