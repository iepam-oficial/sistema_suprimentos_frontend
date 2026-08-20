export type FiscalImportFileKind = 'ncm' | 'cest';

const NCM_EXAMPLE = {
  Data_Ultima_Atualizacao_NCM: 'Vigente em 23/07/2026',
  Ato: 'Resolução Gecex nº 812/2025',
  Nomenclaturas: [
    {
      Codigo: '0101.21.00',
      Descricao: '-- Reprodutores de raça pura',
      Data_Inicio: '01/04/2022',
      Data_Fim: '31/12/9999',
    },
  ],
};

const CEST_EXAMPLE = [
  {
    cest: '09.001.00',
    segmento: 'Lâmpadas reatores e starter',
    ncm: ['8539'],
    descricao: 'Lâmpadas elétricas',
    uf: ['SP'],
  },
];

export const FISCAL_IMPORT_NCM_SNIPPET = JSON.stringify(NCM_EXAMPLE, null, 2);
export const FISCAL_IMPORT_CEST_SNIPPET = JSON.stringify(CEST_EXAMPLE, null, 2);

export function invalidImportMessage(kind: FiscalImportFileKind): string {
  return kind === 'ncm' ? 'JSON NCM inválido' : 'JSON CEST inválido';
}

/** Valida só a estrutura raiz: NCM com Nomenclaturas[]; CEST como array raiz. */
export function validateFiscalImportRoot(
  kind: FiscalImportFileKind,
  payload: unknown,
): boolean {
  if (kind === 'ncm') {
    return (
      payload != null &&
      typeof payload === 'object' &&
      !Array.isArray(payload) &&
      Array.isArray((payload as { Nomenclaturas?: unknown }).Nomenclaturas)
    );
  }
  return Array.isArray(payload);
}

export async function parseAndValidateFiscalImportFile(
  file: File,
  kind: FiscalImportFileKind,
): Promise<{ ok: true; data: unknown } | { ok: false; error: string }> {
  const message = invalidImportMessage(kind);
  let data: unknown;
  try {
    data = JSON.parse(await file.text());
  } catch {
    return { ok: false, error: message };
  }
  if (!validateFiscalImportRoot(kind, data)) {
    return { ok: false, error: message };
  }
  return { ok: true, data };
}
