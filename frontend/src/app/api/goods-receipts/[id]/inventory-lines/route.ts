import { createProxyHandler } from '@/lib/bff/createProxyHandler';
import { NextRequest } from 'next/server';

const handler = createProxyHandler('/goods-receipts/:id/inventory-lines');

export const PUT = (request: NextRequest, context: { params: { id: string } }) =>
  handler.PUT(request, context);
