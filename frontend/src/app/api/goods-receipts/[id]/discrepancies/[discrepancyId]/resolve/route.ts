import { createProxyHandler } from '@/lib/bff/createProxyHandler';
import { NextRequest } from 'next/server';

const handler = createProxyHandler('/goods-receipts/:id/discrepancies/:discrepancyId/resolve');

export const POST = (
  request: NextRequest,
  context: { params: { id: string; discrepancyId: string } }
) => handler.POST(request, context);
