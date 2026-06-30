import { createPublicProxyHandler } from '@/lib/bff/createPublicProxyHandler';
import { NextRequest } from 'next/server';

const handler = createPublicProxyHandler('/public/procurement/cotacao/:token/accept');

export const POST = (request: NextRequest, context: { params: { token: string } }) =>
  handler.POST(request, context);
