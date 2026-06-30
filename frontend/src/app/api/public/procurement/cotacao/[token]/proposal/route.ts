import baseUrl from '@/utils/enviroments';
import type { ProcurementQuoteProposalDTO } from '@ti-assistant/contracts';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(
  request: NextRequest,
  context: { params: { token: string } },
) {
  try {
    const { token } = context.params;
    const backendUrl = `${baseUrl}/public/procurement/cotacao/${encodeURIComponent(token)}/proposal`;
    const contentType = request.headers.get('content-type') ?? '';
    const isMultipart = contentType.includes('multipart/form-data');

    let response: Response;

    if (isMultipart) {
      const formData = await request.formData();
      const backendFormData = new FormData();

      const payload = formData.get('payload');
      if (payload) {
        backendFormData.append('payload', payload);
      }

      const file = formData.get('file');
      if (file && file instanceof Blob) {
        backendFormData.append('file', file);
      }

      response = await fetch(backendUrl, {
        method: 'POST',
        body: backendFormData,
      });
    } else {
      const body = await request.text();
      response = await fetch(backendUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
      });
    }

    if (response.status === 429) {
      const message = await response.text();
      return NextResponse.json(
        { error: 'Rate limit exceeded', details: message },
        { status: 429 },
      );
    }

    const data = (await response.json().catch(() => ({}))) as Partial<ProcurementQuoteProposalDTO> & {
      error?: string;
      message?: string;
    };

    if (!response.ok) {
      return NextResponse.json(
        {
          error:
            data.error ??
            data.message ??
            'Erro ao enviar proposta',
        },
        { status: response.status },
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('[API][public][procurement][cotacao][proposal][POST] Erro:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
