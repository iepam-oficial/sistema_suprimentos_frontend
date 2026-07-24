import { createProxyHandler } from '@/lib/bff/createProxyHandler';

const handler = createProxyHandler('/fiscal-ncms/import');

export const POST = handler.POST;
