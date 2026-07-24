import { createProxyHandler } from '@/lib/bff/createProxyHandler';
import { NextRequest } from 'next/server';

const handler = createProxyHandler('/demand-supplies/:id/approvals');

export const POST = (request: NextRequest, context: { params: { id: string } }) =>
  handler.POST(request, context);
