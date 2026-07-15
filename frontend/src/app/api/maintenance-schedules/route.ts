import { createProxyHandler } from '@/lib/bff/createProxyHandler';

const handler = createProxyHandler('/maintenance-schedules');

export const GET = handler.GET;
export const POST = handler.POST;
