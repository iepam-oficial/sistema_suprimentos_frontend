import { createProxyHandler } from '@/lib/bff/createProxyHandler';
import { NextRequest } from 'next/server';

const handler = createProxyHandler('/tasks/:id/complete');

export const PATCH = (request: NextRequest, context: { params: { id: string } }) =>
  handler.PATCH(request, context);

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
