import { createProxyHandler } from '@/lib/bff/createProxyHandler';
import { NextRequest } from 'next/server';

const handler = createProxyHandler('/goods-receipts');

export const POST = (request: NextRequest) => handler.POST(request);
