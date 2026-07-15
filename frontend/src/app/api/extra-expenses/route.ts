import { createProxyHandler } from '@/lib/bff/createProxyHandler';

const handler = createProxyHandler('/extra-expenses');

export const GET = handler.GET;
export const POST = handler.POST;
