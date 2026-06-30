import { createPublicProxyHandler } from '@/lib/bff/createPublicProxyHandler';
import { NextRequest } from 'next/server';

const handler = createPublicProxyHandler('/public/procurement/cotacao/:token');

export const GET = (request: NextRequest, context: { params: { token: string } }) =>
  handler.GET(request, context);
