import { createProxyHandler } from '@/lib/bff/createProxyHandler';

const handler = createProxyHandler('/sectors/user-locales');

export const GET = handler.GET;
