import baseUrl from '@/utils/enviroments';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function forwardJson(
  token: string,
  id: string,
  method: 'GET' | 'PUT' | 'DELETE',
  body?: unknown,
) {
  const url = `${baseUrl}/support-tickets/${id}`;
  const headers = new Headers();
  headers.set('Authorization', `Bearer ${token}`);
  const init: RequestInit = {
    method,
    headers,
  };
  if (method === 'PUT' && body !== undefined) {
    headers.set('Content-Type', 'application/json');
    init.body = JSON.stringify(body);
  }

  const response = await fetch(url, init);

  if (response.status === 429) {
    const message = await response.text();
    return NextResponse.json(
      { error: 'Rate limit exceeded', details: message },
      { status: 429 },
    );
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    return NextResponse.json(
      { message: (data as { message?: string }).message || 'Erro na requisição' },
      { status: response.status },
    );
  }

  return NextResponse.json(data);
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } },
) {
  console.log('[API][support-tickets][id][GET] Iniciando request');
  try {
    const token = request.headers.get('Authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ message: 'Token não fornecido' }, { status: 401 });
    }
    return forwardJson(token, params.id, 'GET');
  } catch (error) {
    console.error('[API][support-tickets][id][GET] Erro:', error);
    return NextResponse.json({ message: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  console.log('[API][support-tickets][id][PUT] Iniciando request');
  try {
    const token = request.headers.get('Authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ message: 'Token não fornecido' }, { status: 401 });
    }
    const body = await request.json();
    return forwardJson(token, params.id, 'PUT', body);
  } catch (error) {
    console.error('[API][support-tickets][id][PUT] Erro:', error);
    return NextResponse.json({ message: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  console.log('[API][support-tickets][id][DELETE] Iniciando request');
  try {
    const token = request.headers.get('Authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ message: 'Token não fornecido' }, { status: 401 });
    }
    return forwardJson(token, params.id, 'DELETE');
  } catch (error) {
    console.error('[API][support-tickets][id][DELETE] Erro:', error);
    return NextResponse.json({ message: 'Erro interno do servidor' }, { status: 500 });
  }
}
