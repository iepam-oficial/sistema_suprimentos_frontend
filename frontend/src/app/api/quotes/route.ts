import { createProxyHandler } from '@/lib/bff/createProxyHandler';

const handler = createProxyHandler('/quotes');

export const GET = handler.GET;
export const POST = handler.POST;
