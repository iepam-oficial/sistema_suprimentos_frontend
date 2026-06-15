import { createProxyHandler } from '@/lib/bff/createProxyHandler';
import { NextRequest } from 'next/server';

const handler = createProxyHandler('/reports/:slug');

export const GET = (request: NextRequest, context: { params: { slug: string } }) =>
  handler.GET(request, context);
