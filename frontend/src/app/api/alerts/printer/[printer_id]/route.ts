import { createProxyHandler } from '@/lib/bff/createProxyHandler';
import { NextRequest } from 'next/server';

const handler = createProxyHandler('/alerts/printer/:printer_id');

export const GET = (
  request: NextRequest,
  context: { params: { printer_id: string } }
) => handler.GET(request, context);
