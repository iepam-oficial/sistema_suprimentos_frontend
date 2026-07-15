import { createProxyHandler } from '@/lib/bff/createProxyHandler';

const handler = createProxyHandler('/supply-requests');

export const GET = handler.GET;
export const POST = handler.POST;
