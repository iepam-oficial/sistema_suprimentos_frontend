import baseUrl from '@/utils/enviroments';
import type { ImageUploadResponseDTO } from '@ti-assistant/contracts';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('Authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ message: 'Token não fornecido' }, { status: 401 });
    }

    const formData = await request.formData();
    const image = formData.get('image');
    if (!image || !(image instanceof Blob)) {
      return NextResponse.json({ message: 'Nenhuma imagem enviada' }, { status: 400 });
    }

    const backendFormData = new FormData();
    backendFormData.append('image', image);

    const response = await fetch(`${baseUrl}/images/upload`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: backendFormData,
    });

    if (response.status === 429) {
      const message = await response.text();
      return NextResponse.json(
        { error: 'Rate limit exceeded', details: message },
        { status: 429 },
      );
    }

    const data = (await response.json().catch(() => ({}))) as Partial<ImageUploadResponseDTO> & {
      message?: string;
    };

    if (!response.ok) {
      return NextResponse.json(
        { message: (data as { message?: string }).message || 'Erro ao enviar imagem' },
        { status: response.status },
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('[API][images][upload][POST] Erro:', error);
    return NextResponse.json({ message: 'Erro interno do servidor' }, { status: 500 });
  }
}
