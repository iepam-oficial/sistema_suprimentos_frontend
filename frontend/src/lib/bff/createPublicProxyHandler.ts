import baseUrl from '@/utils/enviroments';
import { NextRequest, NextResponse } from 'next/server';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

interface ProxyOptions {
  forwardBody?: boolean;
  pathParams?: Record<string, string>;
}

function buildBackendUrl(backendPath: string, pathParams?: Record<string, string>): string {
  let path = backendPath;
  if (pathParams) {
    for (const [key, value] of Object.entries(pathParams)) {
      path = path.replace(`:${key}`, encodeURIComponent(value));
    }
  }
  return `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
}

async function proxyRequest(
  request: NextRequest,
  method: HttpMethod,
  backendPath: string,
  options: ProxyOptions = {}
): Promise<NextResponse> {
  try {
    let url = buildBackendUrl(backendPath, options.pathParams);
    const search = new URL(request.url).search;
    if (search) {
      url += search;
    }

    const headers: Record<string, string> = {};
    const init: RequestInit = { method, headers };

    if (options.forwardBody && method !== 'GET') {
      const body = await request.text();
      if (body) {
        headers['Content-Type'] = request.headers.get('Content-Type') ?? 'application/json';
        init.body = body;
      }
    }

    const response = await fetch(url, init);

    if (response.status === 429) {
      const message = await response.text();
      return NextResponse.json(
        { error: 'Rate limit exceeded', details: message },
        { status: 429 }
      );
    }

    if (response.status === 204) {
      return new NextResponse(null, { status: 204 });
    }

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return NextResponse.json(
        {
          error:
            (data as { message?: string; error?: string }).message ??
            (data as { error?: string }).error ??
            'Erro na requisição',
        },
        { status: response.status }
      );
    }

    return NextResponse.json(data, { status: response.status });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro interno do servidor';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export function createPublicProxyHandler(backendPath: string) {
  return {
    GET: (request: NextRequest, context?: { params?: Record<string, string> }) =>
      proxyRequest(request, 'GET', backendPath, { pathParams: context?.params }),

    POST: (request: NextRequest, context?: { params?: Record<string, string> }) =>
      proxyRequest(request, 'POST', backendPath, { forwardBody: true, pathParams: context?.params }),

    PUT: (request: NextRequest, context?: { params?: Record<string, string> }) =>
      proxyRequest(request, 'PUT', backendPath, { forwardBody: true, pathParams: context?.params }),

    PATCH: (request: NextRequest, context?: { params?: Record<string, string> }) =>
      proxyRequest(request, 'PATCH', backendPath, { forwardBody: true, pathParams: context?.params }),

    DELETE: (request: NextRequest, context?: { params?: Record<string, string> }) =>
      proxyRequest(request, 'DELETE', backendPath, { pathParams: context?.params }),
  };
}
