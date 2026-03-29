import baseUrl from '@/utils/enviroments';
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log('[API][chart-of-accounts][GET] Iniciando request');
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');

    if (!token) {
      console.error('[API][chart-of-accounts][GET] Token não fornecido');
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const response = await fetch(`${baseUrl}/chart-of-accounts/${params.id}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
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
      console.error('[API][chart-of-accounts][GET] Erro ao buscar plano de conta');
      throw new Error('Erro ao buscar plano de conta');
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('[API][chart-of-accounts][GET] Erro na rota /api/chart-of-accounts/[id]:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar plano de conta' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log('[API][chart-of-accounts][PUT] Iniciando request');
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');

    if (!token) {
      console.error('[API][chart-of-accounts][PUT] Token não fornecido');
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();

    const response = await fetch(`${baseUrl}/chart-of-accounts/${params.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    if (response.status === 429) {
      const message = await response.text();
      console.log('[API][chart-of-accounts][PUT] Rate limit exceeded', message);
      return NextResponse.json(
        { error: 'Rate limit exceeded', details: message },
        { status: 429 }
      );
    }

    if (!response.ok) {
      const errorData = await response.json();
      console.error('[API][chart-of-accounts][PUT] Erro ao atualizar plano de conta');
      throw new Error(errorData.message || 'Erro ao atualizar plano de conta');
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('[API][chart-of-accounts][PUT] Erro na rota /api/chart-of-accounts/[id]:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao atualizar plano de conta' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log('[API][chart-of-accounts][DELETE] Iniciando request');
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');

    if (!token) {
      console.error('[API][chart-of-accounts][DELETE] Token não fornecido');
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const response = await fetch(`${baseUrl}/chart-of-accounts/${params.id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (response.status === 429) {
      const message = await response.text();
      console.log('[API][chart-of-accounts][DELETE] Rate limit exceeded', message);
      return NextResponse.json(
        { error: 'Rate limit exceeded', details: message },
        { status: 429 }
      );
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Erro ao excluir plano de conta' }));
      console.error('[API][chart-of-accounts][DELETE] Erro ao excluir plano de conta');
      return NextResponse.json(
        { error: errorData.message || 'Erro ao excluir plano de conta' },
        { status: response.status }
      );
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('[API][chart-of-accounts][DELETE] Erro na rota /api/chart-of-accounts/[id]:', error);
    return NextResponse.json(
      { error: 'Erro ao excluir plano de conta' },
      { status: 500 }
    );
  }
}

