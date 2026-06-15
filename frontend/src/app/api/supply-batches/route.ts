import { createProxyHandler } from '@/lib/bff/createProxyHandler';

const handler = createProxyHandler('/supply-batches');

export const GET = handler.GET;
