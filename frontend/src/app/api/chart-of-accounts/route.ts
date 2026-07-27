import { createProxyHandler } from '@/lib/bff/createProxyHandler';

const handler = createProxyHandler('/chart-of-accounts');

export const GET = handler.GET;
export const POST = handler.POST;
