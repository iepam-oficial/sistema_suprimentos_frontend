import { createProxyHandler } from '@/lib/bff/createProxyHandler';

const handler = createProxyHandler('/depreciation-rates/lookup');

export const GET = handler.GET;
