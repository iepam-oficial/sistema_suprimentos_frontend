import { createProxyHandler } from '@/lib/bff/createProxyHandler';
import { NextRequest } from 'next/server';

const handler = createProxyHandler('/sectors/location/:locationId');

export const GET = (request: NextRequest, context: { params: { locationId: string } }) =>
  handler.GET(request, context);
