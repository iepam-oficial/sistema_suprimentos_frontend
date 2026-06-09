import { createProxyHandler } from '@/lib/bff/createProxyHandler';

const handler = createProxyHandler('/custom-supply-requests');

export const GET = handler.GET;
export const POST = handler.POST;
