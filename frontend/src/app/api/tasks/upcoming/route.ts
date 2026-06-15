import { createProxyHandler } from '@/lib/bff/createProxyHandler';

const handler = createProxyHandler('/tasks/upcoming');

export const GET = handler.GET;
