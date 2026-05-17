import { NextResponse } from 'next/server'

import baseUrl from '@/utils/enviroments';

export async function POST(request: Request) {
  console.log('[API][auth][login][POST] Iniciando request');
  try {
    const { email, password } = await request.json()

    if (!baseUrl) {
      console.error('[API][auth][login][POST] Erro de configuração do servidor');
      return NextResponse.json(
        { message: 'Erro de configuração do servidor' },
        { status: 500 }
      )
    }

    console.log('[API][auth][login][POST] Buscando URL base');
    const apiUrl = `${baseUrl}/users/sessions`
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    })

    if (response.status === 429) {
      const message = await response.text();
      console.log('[API][auth][login][POST] Rate limit exceeded', message);
      return NextResponse.json(
        { error: 'Rate limit exceeded', details: message },
        { status: 429 }
      );
    }

    const data = await response.json()

    if (!response.ok) {
      console.error('[API][auth][login][POST] Erro ao fazer login');
      return NextResponse.json(
        { message: data.message || 'Erro ao fazer login' },
        { status: response.status }
      )
    }

    const res = NextResponse.json(data)
    try {
      const accessToken = data?.accessToken || data?.token;
      if (accessToken) {
        res.cookies.set('@ti-assistant:token', accessToken, {
          httpOnly: true,
          sameSite: 'lax',
          path: '/',
          maxAge: 60 * 60,
        })
      }
      if (data?.refreshToken) {
        res.cookies.set('@ti-assistant:refresh-token', data.refreshToken, {
          httpOnly: true,
          sameSite: 'lax',
          path: '/',
          maxAge: 60 * 60 * 24 * 7,
        })
      }
    } catch (cookieError) {
      console.warn('[API][auth][login][POST] Falha ao setar cookies de sessão', cookieError)
    }

    return res
  } catch (error) {
    console.error('[API][auth][login][POST] Erro:', error);
    return NextResponse.json(
      { message: 'Erro interno do servidor', error: error instanceof Error ? error.message : 'Erro desconhecido' },
      { status: 500 }
    )
  }
} 