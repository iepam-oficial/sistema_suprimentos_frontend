import baseUrl from '@/utils/enviroments';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function getToken(request: Request): string | null {
  return request.headers.get('authorization')?.split(' ')[1] ?? null;
}

export async function GET(request: NextRequest) {
  const token = getToken(request);
  if (!token) {
    return NextResponse.json({ message: 'Token não fornecido' }, { status: 401 });
  }

  try {
    const response = await fetch(`${baseUrl}/purchase-history`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await response.json().catch(() => ({}));
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('[API][purchase-history][GET] Erro:', error);
    return NextResponse.json({ message: 'Erro ao buscar histórico de compras' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const token = getToken(request);
  if (!token) {
    return NextResponse.json({ message: 'Token não fornecido' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const response = await fetch(`${baseUrl}/purchase-history`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json().catch(() => ({}));
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('[API][purchase-history][POST] Erro:', error);
    return NextResponse.json({ message: 'Erro ao registrar compra' }, { status: 500 });
  }
}
