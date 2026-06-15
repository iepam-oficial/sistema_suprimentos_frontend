import { createProxyHandler } from '@/lib/bff/createProxyHandler';

const handler = createProxyHandler('/extra-expenses/total/period');

export const GET = handler.GET;
