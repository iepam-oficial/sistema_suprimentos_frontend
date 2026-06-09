import { createProxyHandler } from '@/lib/bff/createProxyHandler';

const handler = createProxyHandler('/custom-supply-requests/user');

export const GET = handler.GET;
