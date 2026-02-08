import baseUrl from '@/utils/enviroments';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: Request) {
    console.log('[API][statistics][GET] Iniciando request');
    try {
        const token = request.headers.get('authorization')?.split(' ')[1];
        const { searchParams } = new URL(request.url);
        const timeRange = searchParams.get('timeRange') || '30';

        if (!token) {
            console.error('[API][statistics][GET] Token não fornecido');
            return NextResponse.json(
                { message: 'Token não fornecido' },
                { status: 401 }
            );
        }

        // Busca dados de inventário
        const inventoryResponse = await fetch(`${baseUrl}/inventory`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (inventoryResponse.status === 429) {
            const message = await inventoryResponse.text();
            console.log('[API][statistics][GET] Rate limit exceeded', message);
            return NextResponse.json(
                { error: 'Rate limit exceeded', details: message },
                { status: 429 }
            );
        }

        const inventory = await inventoryResponse.json();

        // Busca dados de ordens de serviço
        const serviceOrdersResponse = await fetch(`${baseUrl}/service-orders`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (serviceOrdersResponse.status === 429) {
            const message = await serviceOrdersResponse.text();
            console.log('[API][statistics][GET] Rate limit exceeded', message);
            return NextResponse.json(
                { error: 'Rate limit exceeded', details: message },
                { status: 429 }
            );
        }

        const serviceOrders = await serviceOrdersResponse.json();

        // Busca dados de alertas
        const alertsResponse = await fetch(`${baseUrl}/alerts`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (alertsResponse.status === 429) {
            const message = await alertsResponse.text();
            console.log('[API][statistics][GET] Rate limit exceeded', message);
            return NextResponse.json(
                { error: 'Rate limit exceeded', details: message },
                { status: 429 }
            );
        }
        
        const alerts = await alertsResponse.json();

        // Processa os dados para as estatísticas
        const serviceOrdersByMonth = processTimeData(serviceOrders, 'entry_date', timeRange);
        const inventoryByType = processTypeData(inventory, 'item');
        const alertsByLevel = processStatusData(alerts, 'danger_level');

        return NextResponse.json({
            serviceOrdersByMonth,
            inventoryByType,
            alertsByLevel,
        });
    } catch (error) {
        console.error('[API][statistics][GET] Erro ao buscar estatísticas:', error);
        return NextResponse.json(
            { message: 'Erro ao buscar estatísticas' },
            { status: 500 }
        );
    }
}

function processStatusData(data: any[], statusKey: string) {
    console.log('[API][statistics][GET] Processando dados de status');
    if (!Array.isArray(data)) return [];

    const statusCount = data.reduce((acc: { [key: string]: number }, item: any) => {
        const status = item[statusKey] || 'N/A';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
    }, {});

    return Object.entries(statusCount).map(([status, count]) => ({
        status,
        count,
    }));
}

function processTimeData(data: any[], dateKey: string, timeRange: string) {
    console.log('[API][statistics][GET] Processando dados de tempo');
    if (!Array.isArray(data)) return [];

    const now = new Date();
    const daysAgo = new Date(now.getTime() - parseInt(timeRange) * 24 * 60 * 60 * 1000);

    const filteredData = data.filter((item: any) => {
        const itemDate = new Date(item[dateKey]);
        return itemDate >= daysAgo && itemDate <= now;
    });

    const monthCount = filteredData.reduce((acc: { [key: string]: number }, item: any) => {
        const date = new Date(item[dateKey]);
        const month = date.toLocaleString('pt-BR', { month: 'short' });
        acc[month] = (acc[month] || 0) + 1;
        return acc;
    }, {});

    return Object.entries(monthCount).map(([month, count]) => ({
        month,
        count,
    }));
}

function processTypeData(data: any[], typeKey: string) {
    console.log('[API][statistics][GET] Processando dados de tipo');
    if (!Array.isArray(data)) return [];

    const typeCount = data.reduce((acc: { [key: string]: number }, item: any) => {
        const type = item[typeKey] || 'N/A';
        acc[type] = (acc[type] || 0) + 1;
        return acc;
    }, {});

    return Object.entries(typeCount).map(([type, count]) => ({
        type,
        count,
    }));
} 