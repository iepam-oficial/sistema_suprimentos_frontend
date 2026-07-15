import { createProxyHandler } from '@/lib/bff/createProxyHandler';
import { NextRequest } from 'next/server';

const handler = createProxyHandler('/events/:id/resources');

export const GET = (request: NextRequest, context: { params: { id: string } }) =>
  handler.GET(request, context);

export const POST = (request: NextRequest, context: { params: { id: string } }) =>
  handler.POST(request, context);
