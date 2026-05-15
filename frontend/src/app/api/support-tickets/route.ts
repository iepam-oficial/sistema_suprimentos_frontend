import baseUrl from '@/utils/enviroments';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: NextRequest) {
  console.log('[API][support-tickets][GET] Iniciando request');
  try {
    const token = req.headers.get('Authorization')?.split(' ')[1];
    if (!token) {
      console.warn('[API][support-tickets][GET] Token não fornecido');
      return NextResponse.json({ message: 'Token não fornecido' }, { status: 401 });
    }

    const qs = req.nextUrl.searchParams.toString();
    const url = `${baseUrl}/support-tickets${qs ? `?${qs}` : ''}`;

    const backendRes = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (backendRes.status === 429) {
      const message = await backendRes.text();
      console.log('[API][support-tickets][GET] Rate limit exceeded', message);
      return NextResponse.json(
        { error: 'Rate limit exceeded', details: message },
        { status: 429 },
      );
    }

    if (!backendRes.ok) {
      const error = await backendRes.json().catch(() => ({ message: 'Erro ao buscar chamados' }));
      console.error('[API][support-tickets][GET] Erro:', error);
      return NextResponse.json(error, { status: backendRes.status });
    }

    const data = await backendRes.json();
    if (!Array.isArray(data)) {
      return NextResponse.json({ message: 'Formato de dados inválido' }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('[API][support-tickets][GET] Erro:', error);
    return NextResponse.json({ message: 'Erro ao buscar chamados' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  console.log('[API][support-tickets][POST] Iniciando request');
  try {
    const token = req.headers.get('Authorization')?.split(' ')[1];
    if (!token) {
      console.warn('[API][support-tickets][POST] Token não fornecido');
      return NextResponse.json({ message: 'Token não fornecido' }, { status: 401 });
    }

    const body = await req.json();

    const backendRes = await fetch(`${baseUrl}/support-tickets`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    if (backendRes.status === 429) {
      const message = await backendRes.text();
      console.log('[API][support-tickets][POST] Rate limit exceeded', message);
      return NextResponse.json(
        { error: 'Rate limit exceeded', details: message },
        { status: 429 },
      );
    }

    if (!backendRes.ok) {
      const error = await backendRes.json().catch(() => ({ message: 'Erro ao criar chamado' }));
      console.error('[API][support-tickets][POST] Erro:', error);
      return NextResponse.json(error, { status: backendRes.status });
    }

    const data = await backendRes.json();
    return NextResponse.json(data, { status: 201 });
  } catch (error: unknown) {
    console.error('[API][support-tickets][POST] Erro:', error);
    const message = error instanceof Error ? error.message : 'Erro ao criar chamado';
    return NextResponse.json({ message }, { status: 500 });
  }
}
