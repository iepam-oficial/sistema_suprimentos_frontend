import baseUrl from '@/utils/enviroments'
import { NextResponse } from 'next/server'
import { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
    console.log('[API][auth][session][GET] Início handler', { url: request.url })
    try {
        const authHeader = request.headers.get('authorization') || undefined;
        const headerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
        const xHeaderToken = request.headers.get('x-ti-assistant-token')
            || request.headers.get('x-tiassistant-token')
            || request.headers.get('x-token')
            || undefined;
        const cookieToken = request.cookies.get('@ti-assistant:token')?.value || request.cookies.get('token')?.value;
        const token = headerToken || xHeaderToken || cookieToken

        console.log('[API][auth][session][GET] Tokens encontrados', {
            hasAuthHeader: !!authHeader,
            hasHeaderToken: !!headerToken,
            hasXHeaderToken: !!xHeaderToken,
            hasCookieToken: !!cookieToken,
            resolved: !!token,
        })
        console.log('[API][auth][session][GET] Base URL:', baseUrl)

        if (!token) {
            console.warn('[API][auth][session][GET] Nenhum token encontrado (authorization/x-ti-assistant-token/cookie token)')
            return new NextResponse('Não autorizado', { status: 401 })
        }

        const url = `${baseUrl}/auth/session`;
        console.log('[API][auth][session][GET] Fazendo fetch para:', url)

        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        })

        console.log('[API][auth][session][GET] Resposta recebida', {
            status: response.status,
            ok: response.ok,
            headers: Object.fromEntries(response.headers.entries()),
        })

        if (response.status === 429) {
            const message = await response.text();
            console.log('[API][auth][session][GET] Rate limit exceeded', message);
            return NextResponse.json(
                { error: 'Rate limit exceeded', details: message },
                { status: 429 }
            );
        }

        const rawBody = await response.clone().text();
        console.log('[API][auth][session][GET] Corpo bruto da resposta:', rawBody)

        let data: any;
        try {
            data = await response.json();
        } catch (parseError) {
            console.error('[API][auth][session][GET] Falha ao parsear JSON da resposta:', parseError)
            throw new Error('Resposta do servidor não é um JSON válido')
        }

        console.log('[API][auth][session][GET] JSON parseado:', data)

        if (!response.ok) {
            console.error('[API][auth][session][GET] Resposta não OK', data)
            return NextResponse.json(
                { message: data?.message || 'Erro ao verificar sessão' },
                { status: response.status }
            )
        }

        console.log('[API][auth][session][GET] Sucesso, retornando dados')
        return NextResponse.json(data)
    } catch (error) {
        console.error(
            '[API][auth][session][GET] Erro no handler:',
            error instanceof Error ? { message: error.message, stack: error.stack } : error
        )
        return new NextResponse('Erro interno do servidor', { status: 500 })
    } finally {
        console.log('[API][auth][session][GET] Fim handler')
    }
}

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs'; 