import { createPublicProxyHandler } from '@/lib/bff/createPublicProxyHandler';
import { NextRequest } from 'next/server';

const handler = createPublicProxyHandler('/public/procurement/pedido/:token');

export const GET = (request: NextRequest, context: { params: { token: string } }) =>
  handler.GET(request, context);

export const POST = (request: NextRequest, context: { params: { token: string } }) =>
  handler.POST(request, context);
