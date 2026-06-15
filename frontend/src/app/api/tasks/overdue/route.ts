import { createProxyHandler } from '@/lib/bff/createProxyHandler';

const handler = createProxyHandler('/tasks/overdue');

export const GET = handler.GET;
