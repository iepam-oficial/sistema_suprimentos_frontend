import baseUrl from '@/utils/enviroments';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(
  request: NextRequest,
  context: { params: { id: string } }
): Promise<NextResponse> {
  const token = request.headers.get('Authorization')?.split(' ')[1] ?? null;

  if (!token) {
    return NextResponse.json({ error: 'Token não fornecido' }, { status: 401 });
  }

  try {
    const url = `${baseUrl}/procurement-quotes/${encodeURIComponent(context.params.id)}/close`;

    const headers: Record<string, string> = {
      Authorization: `Bearer ${token}`,
    };
    const init: RequestInit = { method: 'POST', headers };

    const body = await request.text();
    if (body) {
      headers['Content-Type'] = request.headers.get('Content-Type') ?? 'application/json';
      init.body = body;
    }

    const response = await fetch(url, init);

    if (response.status === 429) {
      const message = await response.text();
      return NextResponse.json(
        { error: 'Rate limit exceeded', details: message },
        { status: 429 }
      );
    }

    if (response.status === 204) {
      return new NextResponse(null, { status: 204 });
    }

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const record = data as Record<string, unknown>;
      return NextResponse.json(
        {
          ...record,
          error:
            (record.error as string | undefined) ??
            (record.message as string | undefined) ??
            'Erro na requisição',
        },
        { status: response.status }
      );
    }

    return NextResponse.json(data, { status: response.status });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro interno do servidor';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
