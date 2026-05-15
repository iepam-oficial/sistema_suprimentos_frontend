import baseUrl from '@/utils/enviroments';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: Request) {
  try {
    const token = request.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ message: 'Token não fornecido' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const report = searchParams.get('report');

    if (!report) {
      return NextResponse.json({ message: 'Parâmetro report é obrigatório' }, { status: 400 });
    }

    const query = new URLSearchParams();
    const timeRange = searchParams.get('timeRange');
    const locationId = searchParams.get('locationId');
    const sectorId = searchParams.get('sectorId');
    const supplierId = searchParams.get('supplierId');
    const categoryId = searchParams.get('categoryId');

    if (timeRange) query.set('timeRange', timeRange);
    if (locationId) query.set('locationId', locationId);
    if (sectorId) query.set('sectorId', sectorId);
    if (supplierId) query.set('supplierId', supplierId);
    if (categoryId) query.set('categoryId', categoryId);

    const qs = query.toString();
    const backendPath =
      report === 'filters'
        ? `${baseUrl}/reports/filters`
        : `${baseUrl}/reports/${report}${qs ? `?${qs}` : ''}`;

    const response = await fetch(backendPath, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await response.json().catch(() => ({}));

    if (response.status === 429) {
      return NextResponse.json(
        { error: 'Rate limit exceeded', details: data },
        { status: 429 }
      );
    }

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('[API][reports][GET] Erro:', error);
    return NextResponse.json({ message: 'Erro ao gerar relatório' }, { status: 500 });
  }
}
