import { createProxyHandler } from '@/lib/bff/createProxyHandler';

const handler = createProxyHandler('/depreciation-rates/suggest');

export const GET = handler.GET;
