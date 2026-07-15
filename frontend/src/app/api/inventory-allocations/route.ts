import { createProxyHandler } from '@/lib/bff/createProxyHandler';

const handler = createProxyHandler('/inventory-allocations');

export const GET = handler.GET;
export const POST = handler.POST;
