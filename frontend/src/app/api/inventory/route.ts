import { createProxyHandler } from '@/lib/bff/createProxyHandler';

const handler = createProxyHandler('/inventory');

export const GET = handler.GET;
export const POST = handler.POST;
export const PATCH = handler.PATCH;
