import { createProxyHandler } from '@/lib/bff/createProxyHandler';

const handler = createProxyHandler('/users/technicians');

export const GET = handler.GET;
