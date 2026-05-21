import { NextRequest, NextResponse } from 'next/server';
import baseUrl from '@/utils/enviroments';

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    const body = await request.json();
    const response = await fetch(`${baseUrl}/inventory-allocations/${params.id}/mark-lost`, {
        method: 'PATCH',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
    });

    if (response.status === 429) {
        const message = await response.text();
        return NextResponse.json(
            { error: 'Rate limit exceeded', details: message },
            { status: 429 }
        );
    }

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
}
