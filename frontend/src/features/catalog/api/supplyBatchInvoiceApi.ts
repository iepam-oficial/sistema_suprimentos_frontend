import type { SupplyBatchInvoiceUploadResponseDTO } from '@ti-assistant/contracts';

export type { SupplyBatchInvoiceUploadResponseDTO };

export const uploadSupplyBatchInvoice = async (
  file: File,
): Promise<SupplyBatchInvoiceUploadResponseDTO> => {
  const token =
    typeof window !== 'undefined' ? localStorage.getItem('@ti-assistant:token') : null;

  if (!token) {
    throw new Error('Sessão expirada. Faça login novamente.');
  }

  const formData = new FormData();
  formData.append('file', file);

  let response: Response;
  try {
    response = await fetch('/api/supply-batches/invoice-upload', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
  } catch {
    throw new Error('Erro de conexão. Verifique sua rede e tente novamente.');
  }

  if (response.status === 429) {
    throw new Error('Muitas requisições. Tente novamente em alguns minutos.');
  }

  const data = (await response.json().catch(() => ({}))) as Partial<SupplyBatchInvoiceUploadResponseDTO> & {
    message?: string;
  };

  if (!response.ok) {
    throw new Error(data.message || 'Erro ao enviar nota fiscal');
  }

  if (!data.key || !data.file_type) {
    throw new Error('Resposta inválida do servidor de upload');
  }

  return { key: data.key, file_type: data.file_type };
};
