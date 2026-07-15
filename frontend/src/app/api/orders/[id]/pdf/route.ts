import baseUrl from '@/utils/enviroments';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.headers.get('Authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ message: 'Token não fornecido' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file');
    if (!file || !(file instanceof Blob)) {
      return NextResponse.json({ message: 'Nenhum arquivo PDF enviado' }, { status: 400 });
    }

    const backendFormData = new FormData();
    backendFormData.append('file', file);

    const response = await fetch(`${baseUrl}/service-orders/${params.id}/pdf`, {
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

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return NextResponse.json(
        {
          message:
            (data as { message?: string }).message ||
            (data as { error?: string }).error ||
            'Erro ao enviar PDF',
        },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('[API][orders][pdf][POST] Erro:', error);
    return NextResponse.json({ message: 'Erro interno do servidor' }, { status: 500 });
  }
}
