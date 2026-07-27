import { createProxyHandler } from '@/lib/bff/createProxyHandler';

const handler = createProxyHandler('/depreciation-rates/import');

export const POST = handler.POST;
