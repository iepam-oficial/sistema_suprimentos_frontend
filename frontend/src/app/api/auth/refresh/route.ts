import { NextRequest, NextResponse } from 'next/server';
import baseUrl from '@/utils/enviroments';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const refreshToken =
      body.refreshToken ||
      request.cookies.get('@ti-assistant:refresh-token')?.value;

    if (!refreshToken) {
      return NextResponse.json(
        { message: 'Refresh token não informado' },
        { status: 400 }
      );
    }

    if (!baseUrl) {
      return NextResponse.json(
        { message: 'Erro de configuração do servidor' },
        { status: 500 }
      );
    }

    const response = await fetch(`${baseUrl}/users/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { message: data.message || 'Erro ao renovar sessão' },
        { status: response.status }
      );
    }

    const res = NextResponse.json(data);

    const accessToken = data.accessToken || data.token;
    if (accessToken) {
      res.cookies.set('@ti-assistant:token', accessToken, {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60,
      });
    }

    if (data.refreshToken) {
      res.cookies.set('@ti-assistant:refresh-token', data.refreshToken, {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7,
      });
    }

    return res;
  } catch (error) {
    return NextResponse.json(
      {
        message: 'Erro interno do servidor',
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    );
  }
}
