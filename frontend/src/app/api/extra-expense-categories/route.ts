import { createProxyHandler } from '@/lib/bff/createProxyHandler';

const handler = createProxyHandler('/extra-expense-categories');

export const GET = handler.GET;
export const POST = handler.POST;
