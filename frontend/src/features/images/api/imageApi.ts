import type { ImageUploadResponseDTO } from '@ti-assistant/contracts';

export type { ImageUploadResponseDTO };

export const uploadImage = async (file: File): Promise<string> => {
  const token =
    typeof window !== 'undefined' ? localStorage.getItem('@ti-assistant:token') : null;

  if (!token) {
    throw new Error('Sessão expirada. Faça login novamente.');
  }

  const formData = new FormData();
  formData.append('image', file);

  const response = await fetch('/api/images/upload', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });

  if (response.status === 429) {
    throw new Error('Muitas requisições. Tente novamente em alguns minutos.');
  }

  const data = (await response.json().catch(() => ({}))) as Partial<ImageUploadResponseDTO> & {
    message?: string;
  };

  if (!response.ok) {
    throw new Error(data.message || 'Erro ao enviar imagem');
  }

  if (!data.url) {
    throw new Error('Resposta inválida do servidor de imagens');
  }

  return data.url;
};
