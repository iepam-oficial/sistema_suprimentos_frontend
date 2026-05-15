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

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = (data as { message?: string }).message || 'Erro ao enviar imagem';
    throw new Error(message);
  }

  const url = (data as { url?: string }).url;
  if (!url) {
    throw new Error('Resposta inválida do servidor de imagens');
  }

  return url;
};

export const handleImageChange = (
  e: React.ChangeEvent<HTMLInputElement>,
  setSelectedImage: (file: File | null) => void,
  setPreviewUrl: (url: string) => void,
) => {
  const file = e.target.files?.[0];
  if (file) {
    setSelectedImage(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  }
};
