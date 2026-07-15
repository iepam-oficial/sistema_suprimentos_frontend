import { createProxyHandler } from '@/lib/bff/createProxyHandler';

const handler = createProxyHandler('/quotes/:id/cancel');

export const POST = (req: Request, ctx: { params: { id: string } }) =>
  handler.POST(req as any, { params: { id: ctx.params.id } });
