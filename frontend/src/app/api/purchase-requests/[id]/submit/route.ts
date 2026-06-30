import { createProxyHandler } from '@/lib/bff/createProxyHandler';
import { NextRequest } from 'next/server';

const handler = createProxyHandler('/purchase-requests/:id/submit');

export const POST = (request: NextRequest, context: { params: { id: string } }) =>
  handler.POST(request, context);
