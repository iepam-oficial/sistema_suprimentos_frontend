import { createProxyHandler } from '@/lib/bff/createProxyHandler';

const handler = createProxyHandler('/categories');

export const GET = handler.GET;
export const POST = handler.POST;
