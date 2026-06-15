import { createProxyHandler } from '@/lib/bff/createProxyHandler';
import { NextRequest } from 'next/server';

const handler = createProxyHandler('/service-orders/:id/close');

export const POST = (request: NextRequest, context: { params: { id: string } }) =>
  handler.POST(request, context);

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
