import { createProxyHandler } from '@/lib/bff/createProxyHandler';

const handler = createProxyHandler('/supply-requests/my-requests');

export const GET = handler.GET;
