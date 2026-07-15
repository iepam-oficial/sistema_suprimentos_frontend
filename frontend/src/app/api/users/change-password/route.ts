import { createProxyHandler } from '@/lib/bff/createProxyHandler';

const handler = createProxyHandler('/users/change-password');

export const POST = handler.POST;
