import { createProxyHandler } from '@/lib/bff/createProxyHandler';

const handler = createProxyHandler('/subcategories');

export const GET = handler.GET;
export const POST = handler.POST;
