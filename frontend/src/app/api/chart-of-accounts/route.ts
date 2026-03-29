import baseUrl from '@/utils/enviroments';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    console.log('[API][chart-of-accounts][GET] Iniciando request');
    try {
        const token = request.headers.get('authorization')?.split(' ')[1];
        const { searchParams } = new URL(request.url);
        const tipo = searchParams.get('tipo');

        if (!token) {
            console.warn('[API][chart-of-accounts][GET] Token não fornecido');
            return NextResponse.json(
                { message: 'Token não fornecido' },
                { status: 401 }
            );
        }

        const url = tipo 
            ? `${baseUrl}/chart-of-accounts?tipo=${tipo}`
            : `${baseUrl}/chart-of-accounts`;

        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.status === 429) {
            const message = await response.text();
            console.log('[API][chart-of-accounts][GET] Rate limit exceeded', message);
            return NextResponse.json(
                { error: 'Rate limit exceeded', details: message },
                { status: 429 }
            );
        }

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'Erro desconhecido' }));
            console.error('[API][chart-of-accounts][GET] Erro na resposta:', errorData);
            return NextResponse.json(
                { message: errorData.message || 'Erro ao buscar planos de contas' },
                { status: response.status }
            );
        }

        const data = await response.json();
        console.log('[API][chart-of-accounts][GET] Sucesso');
        return NextResponse.json(data);
    } catch (error) {
        console.error('[API][chart-of-accounts][GET] Erro:', error);
        return NextResponse.json(
            { message: 'Erro interno do servidor' },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
  try {
    console.log('[API][chart-of-accounts][POST] Iniciando request');
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');

    if (!token) {
      console.error('[API][chart-of-accounts][POST] Token não fornecido');
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();

    const response = await fetch(`${baseUrl}/chart-of-accounts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    if (response.status === 429) {
      const message = await response.text();
      console.log('[API][chart-of-accounts][POST] Rate limit exceeded', message);
      return NextResponse.json(
        { error: 'Rate limit exceeded', details: message },
        { status: 429 }
      );
    }

    if (!response.ok) {
      const errorData = await response.json();
      console.error('[API][chart-of-accounts][POST] Erro ao criar plano de conta');
      throw new Error(errorData.message || 'Erro ao criar plano de conta');
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('[API][chart-of-accounts][POST] Erro na rota /api/chart-of-accounts:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao criar plano de conta' },
      { status: 500 }
    );
  }
}

