import { createProxyHandler } from '@/lib/bff/createProxyHandler';

const handler = createProxyHandler('/purchase-requests');

export const GET = handler.GET;
export const POST = handler.POST;
