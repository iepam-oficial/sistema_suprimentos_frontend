import { createProxyHandler } from '@/lib/bff/createProxyHandler';
import { NextRequest } from 'next/server';

const handler = createProxyHandler('/demand-supplies/:id');

export const GET = (request: NextRequest, context: { params: { id: string } }) =>
  handler.GET(request, context);
