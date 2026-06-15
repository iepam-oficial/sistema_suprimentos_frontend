import { createProxyHandler } from '@/lib/bff/createProxyHandler';

const handler = createProxyHandler('/service-orders');

export const GET = handler.GET;
export const POST = handler.POST;

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
