import baseUrl from '@/utils/enviroments';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function proxy(request: NextRequest, pathSegments: string[]) {
  const token = request.headers.get('authorization')?.split(' ')[1];
  if (!token) {
    return NextResponse.json({ message: 'Token não fornecido' }, { status: 401 });
  }

  const subPath = pathSegments.join('/');
  const url = new URL(request.url);
  const target = `${baseUrl}/purchase-history/${subPath}${url.search}`;

  try {
    const init: RequestInit = {
      method: request.method,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    };

    if (request.method !== 'GET' && request.method !== 'HEAD') {
      const body = await request.text();
      if (body) init.body = body;
    }

    const response = await fetch(target, init);
    const data = await response.json().catch(() => ({}));
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('[API][purchase-history][proxy] Erro:', error);
    return NextResponse.json({ message: 'Erro ao processar requisição' }, { status: 500 });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return proxy(request, params.path);
}

export async function POST(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return proxy(request, params.path);
}
