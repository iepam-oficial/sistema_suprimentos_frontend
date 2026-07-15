import { createProxyHandler } from '@/lib/bff/createProxyHandler';

const handler = createProxyHandler('/internal-service-orders');

export const GET = handler.GET;
export const POST = handler.POST;
