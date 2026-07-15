import { createProxyHandler } from '@/lib/bff/createProxyHandler';
import { NextRequest } from 'next/server';

const handler = createProxyHandler('/procurement-quotes/:id/invites/:inviteId/reviews');

export const GET = (
  request: NextRequest,
  context: { params: { id: string; inviteId: string } }
) => handler.GET(request, context);
