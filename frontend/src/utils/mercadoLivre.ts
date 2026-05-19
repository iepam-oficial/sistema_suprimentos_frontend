export interface MercadoLivreApiItem {
  id: string;
  title: string;
  price: number;
  permalink: string;
  attributes?: Array<{
    id: string;
    name: string;
    value_name: string | null;
  }>;
}

export interface QuoteItemFromML {
  product_name: string;
  manufacturer: string;
  quantity: number;
  unit_price: number;
  link: string;
  notes?: string;
}

const ML_DOMAIN_PATTERN =
  /mercadolivre\.com\.br|mercadolibre\.com|produto\.mercadolivre|articulo\.mercadolibre/i;

const MLB_ID_PATTERN = /MLB-?\d+/i;

export function isMercadoLivreUrl(url: string): boolean {
  return ML_DOMAIN_PATTERN.test(url);
}

export function extractMercadoLivreItemId(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  const mlbInText = trimmed.match(MLB_ID_PATTERN);
  if (mlbInText) {
    return mlbInText[0].replace('-', '').toUpperCase();
  }

  try {
    const url = trimmed.startsWith('http') ? trimmed : `https://${trimmed}`;
    const parsed = new URL(url);
    const pathMatch = parsed.pathname.match(MLB_ID_PATTERN);
    if (pathMatch) {
      return pathMatch[0].replace('-', '').toUpperCase();
    }
    const itemParam = parsed.searchParams.get('item_id') || parsed.searchParams.get('id');
    if (itemParam && MLB_ID_PATTERN.test(itemParam)) {
      return itemParam.replace('-', '').toUpperCase();
    }
  } catch {
    // ignore invalid URL
  }

  return null;
}

export function extractUrlFromShareText(text: string): string | null {
  const urlMatch = text.match(/https?:\/\/[^\s]+/i);
  if (!urlMatch) return null;
  return urlMatch[0].replace(/[)\]},.]+$/, '');
}

function resolveLinkSource(rawLink: string): string {
  const trimmed = rawLink.trim();
  const fromText = extractUrlFromShareText(trimmed);
  if (fromText && isMercadoLivreUrl(fromText)) return fromText;
  if (isMercadoLivreUrl(trimmed)) {
    return trimmed.startsWith('http') ? trimmed : `https://${trimmed}`;
  }
  return trimmed;
}

export async function fetchMercadoLivreProduct(
  itemId: string,
  token: string
): Promise<MercadoLivreApiItem> {
  const response = await fetch(`/api/mercadolivre/items/${itemId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(
      (data as { error?: string }).error ||
        'Não foi possível carregar os dados do produto no Mercado Livre.'
    );
  }

  return response.json();
}

function extractBrand(apiItem: MercadoLivreApiItem): string {
  const brandAttr = apiItem.attributes?.find(
    (attr) => attr.id === 'BRAND' || attr.name?.toLowerCase() === 'marca'
  );
  return brandAttr?.value_name?.trim() || 'Não especificado';
}

export function mapToQuoteItem(apiItem: MercadoLivreApiItem): QuoteItemFromML {
  const unitPrice = apiItem.price ?? 0;
  return {
    product_name: apiItem.title,
    quantity: 1,
    unit_price: unitPrice,
    link: apiItem.permalink,
    manufacturer: extractBrand(apiItem),
    notes: 'Importado do Mercado Livre',
  };
}

export async function importProductFromLink(
  rawLink: string,
  token: string
): Promise<QuoteItemFromML> {
  const idSource = resolveLinkSource(rawLink);
  const itemId = extractMercadoLivreItemId(idSource);

  if (!itemId) {
    throw new Error('Link do Mercado Livre inválido ou não reconhecido.');
  }

  const apiItem = await fetchMercadoLivreProduct(itemId, token);
  return mapToQuoteItem(apiItem);
}
