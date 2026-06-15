import { createProxyHandler } from '@/lib/bff/createProxyHandler';

const handler = createProxyHandler('/unit-of-measures');

export const GET = handler.GET;
export const POST = handler.POST;
