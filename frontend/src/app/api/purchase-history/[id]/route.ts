import baseUrl from '@/utils/enviroments';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const token = request.headers.get('authorization')?.split(' ')[1];
  if (!token) {
    return NextResponse.json({ message: 'Token não fornecido' }, { status: 401 });
  }

  try {
    const response = await fetch(`${baseUrl}/purchase-history/${params.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await response.json().catch(() => ({}));
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('[API][purchase-history][GET id] Erro:', error);
    return NextResponse.json({ message: 'Erro ao buscar compra' }, { status: 500 });
  }
}
