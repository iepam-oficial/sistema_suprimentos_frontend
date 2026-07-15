import { createProxyHandler } from '@/lib/bff/createProxyHandler';

const handler = createProxyHandler('/fiscal-cests');

export const GET = handler.GET;
export const POST = handler.POST;
