import { NextResponse } from 'next/server';

const MLB_ID_VALID = /^MLB\d+$/i;

export async function GET(
  request: Request,
  { params }: { params: { itemId: string } }
) {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '');
  if (!token) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const itemId = params.itemId?.replace('-', '').toUpperCase();
  if (!itemId || !MLB_ID_VALID.test(itemId)) {
    return NextResponse.json(
      { error: 'ID do produto Mercado Livre inválido.' },
      { status: 400 }
    );
  }

  try {
    const response = await fetch(`https://api.mercadolibre.com/items/${itemId}`, {
      next: { revalidate: 300 },
    });

    if (response.status === 404) {
      return NextResponse.json(
        { error: 'Produto não encontrado no Mercado Livre.' },
        { status: 404 }
      );
    }

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Não foi possível carregar os dados do produto no Mercado Livre.' },
        { status: response.status >= 500 ? 502 : response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json({
      id: data.id,
      title: data.title,
      price: data.price,
      permalink: data.permalink,
      attributes: data.attributes,
    });
  } catch {
    return NextResponse.json(
      { error: 'Não foi possível carregar os dados do produto no Mercado Livre.' },
      { status: 502 }
    );
  }
}
