import baseUrl from '@/utils/enviroments';
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: Request) {
    console.log('[API][dashboard][GET] Iniciando request');
    try {
        const token = request.headers.get('authorization')?.split(' ')[1]

        if (!token) {
            console.warn('[API][dashboard][GET] Token não fornecido');
            return NextResponse.json(
                { message: 'Token não fornecido' },
                { status: 401 }
            )
        }

        // Busca dados de inventário
        const inventoryResponse = await fetch(`${baseUrl}/inventory`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })

        if (inventoryResponse.status === 429) {
            const message = await inventoryResponse.text();
            console.log('[API][dashboard][GET] Rate limit exceeded', message);
            return NextResponse.json(
                { error: 'Rate limit exceeded', details: message },
                { status: 429 }
            );
        }

        const inventory = await inventoryResponse.json()

        // Busca dados de ordens de serviço
        const serviceOrdersResponse = await fetch(`${baseUrl}/service-orders`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })

        if (serviceOrdersResponse.status === 429) {
            const message = await serviceOrdersResponse.text();
            console.log('[API][dashboard][GET] Rate limit exceeded', message);
            return NextResponse.json(
                { error: 'Rate limit exceeded', details: message },
                { status: 429 }
            );
        }

        const serviceOrders = await serviceOrdersResponse.json()

        // Busca dados de alertas
        const alertsResponse = await fetch(`${baseUrl}/alerts`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })

        if (alertsResponse.status === 429) {
            const message = await alertsResponse.text();
            console.log('[API][dashboard][GET] Rate limit exceeded', message);
            return NextResponse.json(
                { error: 'Rate limit exceeded', details: message },
                { status: 429 }
            );
        }

        const alertsData = await alertsResponse.json()

        // Busca dados de fornecedores
        const suppliersResponse = await fetch(`${baseUrl}/suppliers`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })

        if (suppliersResponse.status === 429) {
            const message = await suppliersResponse.text();
            console.log('[API][dashboard][GET] Rate limit exceeded', message);
            return NextResponse.json(
                { error: 'Rate limit exceeded', details: message },
                { status: 429 }
            );
        }

        const suppliers = await suppliersResponse.json()

        // Busca dados de cotações
        const quotesResponse = await fetch(`${baseUrl}/quotes`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })

        if (quotesResponse.status === 429) {
            const message = await quotesResponse.text();
            console.log('[API][dashboard][GET] Rate limit exceeded', message);
            return NextResponse.json(
                { error: 'Rate limit exceeded', details: message },
                { status: 429 }
            );
        }

        const quotes = await quotesResponse.json()

        // Busca dados de requisições de suprimentos
        const supplyRequestsResponse = await fetch(`${baseUrl}/supply-requests`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })

        if (supplyRequestsResponse.status === 429) {
            const message = await supplyRequestsResponse.text();
            console.log('[API][dashboard][GET] Rate limit exceeded', message);
            return NextResponse.json(
                { error: 'Rate limit exceeded', details: message },
                { status: 429 }
            );
        }

        const supplyRequests = await supplyRequestsResponse.json()

        // Garante que alerts é um array
        const alerts = Array.isArray(alertsData) ? alertsData : []

        // Processa os dados de tendência de consumo
        const consumptionTrends = processConsumptionTrends(supplyRequests)

        // Processa o tempo médio de entrega por mês (requisições com status DELIVERED)
        const averageDeliveryTimeTrends = processAverageDeliveryTimeTrends(supplyRequests)

        // Calcula estatísticas
        const stats = {
            totalInventory: Array.isArray(inventory) ? inventory.length : 0,
            totalInventoryValue: Array.isArray(inventory) ? inventory.reduce((total: number, item: any) => total + (item.acquisition_price || 0), 0) : 0,
            totalServiceOrders: Array.isArray(serviceOrders) ? serviceOrders.length : 0,
            totalServiceOrdersValue: Array.isArray(serviceOrders) ? serviceOrders.reduce((total: number, order: any) => total + (order.total_price || 0), 0) : 0,
            openServiceOrders: Array.isArray(serviceOrders) ? serviceOrders.filter((so: any) => !so.exit_date).length : 0,
            criticalAlerts: alerts.filter((a: any) => a.danger_level === 'HIGH').length,
            consumptionTrends,
            averageDeliveryTimeTrends,
            totalSuppliers: Array.isArray(suppliers) ? suppliers.length : 0,
            totalQuotes: Array.isArray(quotes) ? quotes.length : 0,
            pendingQuotes: Array.isArray(quotes) ? quotes.filter((q: any) => q.status === 'PENDING').length : 0,
            totalSupplyRequests: Array.isArray(supplyRequests) ? supplyRequests.length : 0,
            pendingSupplyRequests: Array.isArray(supplyRequests) ? supplyRequests.filter((sr: any) => sr.status === 'PENDENTE').length : 0,
        }

        return NextResponse.json({
            stats,
            recentAlerts: alerts.slice(0, 5), // 5 alertas mais recentes
            recentServiceOrders: Array.isArray(serviceOrders) ? serviceOrders.slice(0, 5) : [], // 5 OS mais recentes
        })
    } catch (error) {
        console.error('[API][dashboard][GET] Erro:', error);
        return NextResponse.json(
            { message: 'Erro ao buscar dados da dashboard' },
            { status: 500 }
        )
    }
}

function processConsumptionTrends(supplyRequests: any[]) {
    if (!Array.isArray(supplyRequests)) return [];

    const monthlyConsumption = supplyRequests.reduce((acc: { [key: string]: number }, request: any) => {
        if (request.status === 'APPROVED') {
            const date = new Date(request.created_at);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            acc[monthKey] = (acc[monthKey] || 0) + request.quantity;
        }
        return acc;
    }, {});

    return Object.entries(monthlyConsumption)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, quantity]) => ({
            date,
            quantity,
        }));
}

/**
 * Tempo médio de entrega em dias, por mês (requisições com status DELIVERED).
 * Usa (updated_at - created_at) como proxy da data de entrega.
 */
function processAverageDeliveryTimeTrends(supplyRequests: any[]) {
    if (!Array.isArray(supplyRequests)) return [];

    const delivered = supplyRequests.filter((r: any) => r.status === 'DELIVERED');
    const byMonth: { [key: string]: number[] } = {};

    for (const request of delivered) {
        const created = new Date(request.created_at).getTime();
        const updated = new Date(request.updated_at).getTime();
        const days = Math.round((updated - created) / (1000 * 60 * 60 * 24));
        const date = new Date(request.updated_at);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        if (!byMonth[monthKey]) byMonth[monthKey] = [];
        byMonth[monthKey].push(days);
    }

    return Object.entries(byMonth)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, daysArray]) => ({
            date,
            averageDays: daysArray.length
                ? Math.round((daysArray.reduce((s, d) => s + d, 0) / daysArray.length) * 10) / 10
                : 0,
        }));
} 