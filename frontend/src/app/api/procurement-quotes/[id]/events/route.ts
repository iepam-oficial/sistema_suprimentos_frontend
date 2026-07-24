import { createProxyHandler } from '@/lib/bff/createProxyHandler';
import { NextRequest } from 'next/server';

const handler = createProxyHandler('/procurement-quotes/:id/events');

export const GET = (request: NextRequest, context: { params: { id: string } }) =>
  handler.GET(request, context);
