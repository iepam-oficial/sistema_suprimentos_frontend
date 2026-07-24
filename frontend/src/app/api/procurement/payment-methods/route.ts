import { createProxyHandler } from '@/lib/bff/createProxyHandler';
import { NextRequest } from 'next/server';

const handler = createProxyHandler('/procurement/payment-methods');

export const GET = (request: NextRequest) => handler.GET(request);
export const POST = (request: NextRequest) => handler.POST(request);
