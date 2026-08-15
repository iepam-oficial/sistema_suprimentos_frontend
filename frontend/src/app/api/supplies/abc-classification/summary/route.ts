import { createProxyHandler } from '@/lib/bff/createProxyHandler';

const handler = createProxyHandler('/supplies/abc-classification/summary');

export const GET = handler.GET;
