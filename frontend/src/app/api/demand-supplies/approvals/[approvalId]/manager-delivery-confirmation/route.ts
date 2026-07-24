import { createProxyHandler } from '@/lib/bff/createProxyHandler';
import { NextRequest } from 'next/server';

const handler = createProxyHandler('/demand-supplies/approvals/:approvalId/manager-delivery-confirmation');

export const PATCH = (request: NextRequest, context: { params: { approvalId: string } }) =>
  handler.PATCH(request, context);
