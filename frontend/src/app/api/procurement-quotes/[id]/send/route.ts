import { createProxyHandler } from '@/lib/bff/createProxyHandler';
import { NextRequest } from 'next/server';

const handler = createProxyHandler('/procurement-quotes/:id/send');

export const POST = (request: NextRequest, context: { params: { id: string } }) =>
  handler.POST(request, context);
