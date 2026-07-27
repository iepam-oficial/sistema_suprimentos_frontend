import { createProxyHandler } from '@/lib/bff/createProxyHandler';

const handler = createProxyHandler('/fiscal-ncms');

export const GET = handler.GET;
export const POST = handler.POST;
