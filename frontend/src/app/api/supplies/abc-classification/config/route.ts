import { createProxyHandler } from '@/lib/bff/createProxyHandler';

const handler = createProxyHandler('/supplies/abc-classification/config');

export const GET = handler.GET;
export const PUT = handler.PUT;
