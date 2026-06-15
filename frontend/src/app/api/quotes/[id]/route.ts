import { createProxyHandler } from '@/lib/bff/createProxyHandler';

const handler = createProxyHandler('/quotes/:id');

export const GET = (req: Request, ctx: { params: { id: string } }) =>
  handler.GET(req as any, { params: { id: ctx.params.id } });

export const PUT = (req: Request, ctx: { params: { id: string } }) =>
  handler.PUT(req as any, { params: { id: ctx.params.id } });

export const DELETE = (req: Request, ctx: { params: { id: string } }) =>
  handler.DELETE(req as any, { params: { id: ctx.params.id } });
