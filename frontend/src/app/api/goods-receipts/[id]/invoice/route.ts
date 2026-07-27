import baseUrl from '@/utils/enviroments';
import type { GoodsReceiptDTO } from '@ti-assistant/contracts';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const token = request.headers.get('Authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ error: 'Token não fornecido' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('invoice');
    if (!file || !(file instanceof Blob)) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 });
    }

    const backendFormData = new FormData();
    backendFormData.append('invoice', file);

    const { id } = context.params;
    const response = await fetch(`${baseUrl}/goods-receipts/${encodeURIComponent(id)}/invoice`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: backendFormData,
    });

    if (response.status === 429) {
      const message = await response.text();
      return NextResponse.json(
        { error: 'Rate limit exceeded', details: message },
        { status: 429 }
      );
    }

    const data = (await response.json().catch(() => ({}))) as Partial<GoodsReceiptDTO> & {
      error?: string;
      message?: string;
    };

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error ?? data.message ?? 'Erro ao enviar nota fiscal' },
        { status: response.status }
      );
    }

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('[API][goods-receipts][invoice][POST] Erro:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
