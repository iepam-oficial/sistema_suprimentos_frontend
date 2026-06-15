import { createProxyHandler } from '@/lib/bff/createProxyHandler';

const handler = createProxyHandler('/users/me');

export const GET = handler.GET;
