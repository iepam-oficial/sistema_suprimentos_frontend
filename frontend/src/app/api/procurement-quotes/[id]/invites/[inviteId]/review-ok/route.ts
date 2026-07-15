import { createProxyHandler } from '@/lib/bff/createProxyHandler';
import { NextRequest } from 'next/server';

const handler = createProxyHandler('/procurement-quotes/:id/invites/:inviteId/review-ok');

export const POST = (
  request: NextRequest,
  context: { params: { id: string; inviteId: string } }
) => handler.POST(request, context);
