import baseUrl from '@/utils/enviroments';
import type { PortalQuotePdfSuggestionsDTO } from '@ti-assistant/contracts';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(
  request: NextRequest,
  context: { params: { token: string } },
) {
  try {
    const { token } = context.params;
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json({ error: 'Nenhum arquivo PDF enviado' }, { status: 400 });
    }

    const backendFormData = new FormData();
    backendFormData.append('file', file);

    const response = await fetch(
      `${baseUrl}/public/procurement/cotacao/${encodeURIComponent(token)}/extract-pdf`,
      {
        method: 'POST',
        body: backendFormData,
      },
    );

    if (response.status === 429) {
      const message = await response.text();
      return NextResponse.json(
        { error: 'Rate limit exceeded', details: message },
        { status: 429 },
      );
    }

    const data = (await response.json().catch(() => ({}))) as Partial<PortalQuotePdfSuggestionsDTO> & {
      error?: string;
      message?: string;
    };

    if (!response.ok) {
      return NextResponse.json(
        {
          error:
            data.error ??
            data.message ??
            'Erro ao extrair dados do PDF',
        },
        { status: response.status },
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('[API][public][procurement][cotacao][extract-pdf][POST] Erro:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
