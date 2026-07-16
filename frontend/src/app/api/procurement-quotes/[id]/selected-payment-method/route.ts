import { createProxyHandler } from '@/lib/bff/createProxyHandler';
import { NextRequest } from 'next/server';

const handler = createProxyHandler('/procurement-quotes/:id/selected-payment-method');

export const PATCH = (request: NextRequest, context: { params: { id: string } }) =>
  handler.PATCH(request, context);
