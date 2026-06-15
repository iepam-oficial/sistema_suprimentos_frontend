import { createProxyHandler } from '@/lib/bff/createProxyHandler';

const handler = createProxyHandler('/support-tickets');

export const GET = handler.GET;
export const POST = handler.POST;
