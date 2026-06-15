import { createProxyHandler } from '@/lib/bff/createProxyHandler';

const handler = createProxyHandler('/tasks');

export const GET = handler.GET;
export const POST = handler.POST;
