import { createProxyHandler } from '@/lib/bff/createProxyHandler';
import { NextRequest } from 'next/server';

const handler = createProxyHandler('/demand-supplies/approvals/:approvalId/report');

export const GET = (request: NextRequest, context: { params: { approvalId: string } }) =>
  handler.GET(request, context);
