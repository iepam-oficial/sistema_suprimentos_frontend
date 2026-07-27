import { createProxyHandler } from '@/lib/bff/createProxyHandler';
import { NextRequest } from 'next/server';

const handler = createProxyHandler('/purchase-history/supplier/:supplier_id');

export const GET = (request: NextRequest, context: { params: { supplier_id: string } }) =>
  handler.GET(request, context);
