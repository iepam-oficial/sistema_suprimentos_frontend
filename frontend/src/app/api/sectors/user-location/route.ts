import { createProxyHandler } from '@/lib/bff/createProxyHandler';

const handler = createProxyHandler('/sectors/user-location');

export const GET = handler.GET;
