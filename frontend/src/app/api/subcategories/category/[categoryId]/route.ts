import { createProxyHandler } from '@/lib/bff/createProxyHandler';
import { NextRequest } from 'next/server';

const handler = createProxyHandler('/subcategories/category/:categoryId');

export const GET = (request: NextRequest, context: { params: { categoryId: string } }) =>
  handler.GET(request, context);
