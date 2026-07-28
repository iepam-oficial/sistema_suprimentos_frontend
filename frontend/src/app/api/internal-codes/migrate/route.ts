import { createProxyHandler } from '@/lib/bff/createProxyHandler';

const handler = createProxyHandler('/internal-codes/migrate');

export const POST = handler.POST;
