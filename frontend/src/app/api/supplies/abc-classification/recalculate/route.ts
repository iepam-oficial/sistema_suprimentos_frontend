import { createProxyHandler } from '@/lib/bff/createProxyHandler';

const handler = createProxyHandler('/supplies/abc-classification/recalculate');

export const POST = handler.POST;
