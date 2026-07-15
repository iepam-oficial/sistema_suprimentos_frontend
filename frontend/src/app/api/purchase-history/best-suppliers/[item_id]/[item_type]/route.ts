import { createProxyHandler } from '@/lib/bff/createProxyHandler';
import { NextRequest } from 'next/server';

const handler = createProxyHandler('/purchase-history/best-suppliers/:item_id/:item_type');

export const GET = (
  request: NextRequest,
  context: { params: { item_id: string; item_type: string } }
) => handler.GET(request, context);
