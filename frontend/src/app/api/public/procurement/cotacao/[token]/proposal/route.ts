import baseUrl from '@/utils/enviroments';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function proxyProposal(
  request: NextRequest,
  method: 'POST' | 'PUT',
  context: { params: { token: string } }
): Promise<NextResponse> {
  try {
    const url = `${baseUrl}/public/procurement/cotacao/${encodeURIComponent(
      context.params.token
    )}/proposal`;

    const contentType = request.headers.get('Content-Type') ?? '';
    const init: RequestInit = { method };

    if (contentType.includes('multipart/form-data')) {
      // Repassa o multipart intacto (campo de arquivo `file` + `payload`).
      // Não definir Content-Type manualmente: o fetch recria o boundary.
      init.body = await request.formData();
    } else {
      const body = await request.text();
      if (body) {
        init.headers = { 'Content-Type': contentType || 'application/json' };
        init.body = body;
      }
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
      return NextResponse.json(
        {
          error:
            (data as { message?: string; error?: string }).message ??
            (data as { error?: string }).error ??
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

export const POST = (request: NextRequest, context: { params: { token: string } }) =>
  proxyProposal(request, 'POST', context);

export const PUT = (request: NextRequest, context: { params: { token: string } }) =>
  proxyProposal(request, 'PUT', context);
