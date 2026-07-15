import { createProxyHandler } from '@/lib/bff/createProxyHandler';
import { NextRequest } from 'next/server';

const handler = createProxyHandler('/extra-expense-categories/:id');

export const GET = (request: NextRequest, context: { params: { id: string } }) =>
  handler.GET(request, context);

export const PUT = (request: NextRequest, context: { params: { id: string } }) =>
  handler.PUT(request, context);

export const DELETE = (request: NextRequest, context: { params: { id: string } }) =>
  handler.DELETE(request, context);
