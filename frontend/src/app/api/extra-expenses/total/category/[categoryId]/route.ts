import { createProxyHandler } from '@/lib/bff/createProxyHandler';
import { NextRequest } from 'next/server';

const handler = createProxyHandler('/extra-expenses/total/category/:categoryId');

export const GET = (
  request: NextRequest,
  context: { params: { categoryId: string } }
) => handler.GET(request, context);
