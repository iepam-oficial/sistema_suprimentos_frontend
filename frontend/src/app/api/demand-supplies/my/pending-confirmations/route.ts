import { createProxyHandler } from '@/lib/bff/createProxyHandler';

const handler = createProxyHandler('/demand-supplies/my/pending-confirmations');

export const GET = handler.GET;
