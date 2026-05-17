'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { uploadImage, handleImageChange } from '@/utils/imageUtils';
import { canCreateSupportTicket, SupportTicketKind } from '../types';
import { cardClass, inputClass, labelClass, btnPrimary, btnSecondary } from '@/components/support-desk/formClasses';
import { cn } from '@/components/support-desk/cn';

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

interface Location {
  id: string;
  name: string;
}

interface Sector {
  id: string;
  name: string;
  location_id: string;
}

export default function NewSupportTicketPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [bootLoading, setBootLoading] = useState(true);
  const [locations, setLocations] = useState<Location[]>([]);
  const [sectors, setSectors] = useState<Sector[]>([]);

  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('MEDIUM');
  const [ticketType, setTicketType] = useState<SupportTicketKind>('INCIDENT');
  const [locationId, setLocationId] = useState('');
  const [sectorId, setSectorId] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('@ti-assistant:token');
    const userRaw = localStorage.getItem('@ti-assistant:user');
    if (!token || !userRaw) {
      router.push('/');
      return;
    }
    const user = JSON.parse(userRaw) as { role?: string };
    const role = user.role ?? '';
    if (!canCreateSupportTicket(role)) {
      router.push('/unauthorized');
      return;
    }

    const load = async () => {
      try {
        const locRes = await fetch('/api/locations', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (locRes.ok) {
          const locData = await locRes.json();
          setLocations(Array.isArray(locData) ? locData : []);
        }
      } catch {
        // formulário ainda funciona sem local
      } finally {
        setBootLoading(false);
      }
    };
    load();
  }, [router]);

  useEffect(() => {
    if (!locationId) {
      setSectors([]);
      return;
    }
    const token = localStorage.getItem('@ti-assistant:token');
    if (!token) return;
    let cancelled = false;
    const loadSectors = async () => {
      try {
        const secRes = await fetch(`/api/sectors/location/${locationId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!secRes.ok) {
          if (!cancelled) setSectors([]);
          return;
        }
        const secData = await secRes.json();
        if (!cancelled) setSectors(Array.isArray(secData) ? secData : []);
      } catch {
        if (!cancelled) setSectors([]);
      }
    };
    loadSectors();
    return () => {
      cancelled = true;
    };
  }, [locationId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('@ti-assistant:token');
    if (!token) return;

    setLoading(true);
    try {
      let imageUrl: string | undefined;
      if (selectedImage) {
        if (!selectedImage.type.startsWith('image/')) {
          toast.error('Selecione uma imagem (JPEG, PNG, etc.).');
          setLoading(false);
          return;
        }
        if (selectedImage.size > MAX_IMAGE_BYTES) {
          toast.error('O tamanho máximo da imagem é 5 MB.');
          setLoading(false);
          return;
        }
        try {
          imageUrl = await uploadImage(selectedImage);
        } catch (uploadError: unknown) {
          toast.error(
            uploadError instanceof Error
              ? uploadError.message
              : 'Não foi possível enviar a imagem.',
          );
          setLoading(false);
          return;
        }
      }

      const body: Record<string, unknown> = {
        subject: subject.trim(),
        description: description.trim(),
        priority,
        ticket_type: ticketType,
      };
      if (locationId) body.location_id = locationId;
      if (sectorId) body.sector_id = sectorId;
      if (imageUrl) body.image_url = imageUrl;

      const res = await fetch('/api/support-tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (res.status === 429) {
        router.push('/rate-limit');
        return;
      }

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Erro ao criar chamado');
      }

      const created = await res.json();
      toast.success('Chamado criado');
      router.push(`/support-tickets/${created.id}`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erro ao criar chamado');
    } finally {
      setLoading(false);
    }
  };

  if (bootLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center bg-slate-50 dark:bg-slate-900">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="min-h-full bg-slate-50 dark:bg-slate-900">
      <div className="mx-auto max-w-2xl px-4 py-6 md:px-8">
        <button
          type="button"
          onClick={() => router.push('/support-tickets')}
          className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </button>

        <form onSubmit={handleSubmit} className={cn(cardClass, 'space-y-4')}>
          <h1 className="text-xl font-semibold text-slate-800 dark:text-slate-100">Novo chamado</h1>

          <div>
            <label className={labelClass}>
              Assunto <span className="text-red-500">*</span>
            </label>
            <input
              className={inputClass}
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
            />
          </div>

          <div>
            <label className={labelClass}>
              Descrição <span className="text-red-500">*</span>
            </label>
            <textarea
              className={cn(inputClass, 'resize-y')}
              rows={6}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>

          <div>
            <label className={labelClass}>Prioridade</label>
            <select className={inputClass} value={priority} onChange={(e) => setPriority(e.target.value)}>
              <option value="LOW">Baixa</option>
              <option value="MEDIUM">Média</option>
              <option value="HIGH">Alta</option>
              <option value="URGENT">Urgente</option>
            </select>
          </div>

          <div>
            <label className={labelClass}>
              Tipo de chamado <span className="text-red-500">*</span>
            </label>
            <select
              className={inputClass}
              value={ticketType}
              onChange={(e) => setTicketType(e.target.value as SupportTicketKind)}
              required
            >
              <option value="INCIDENT">Incidente</option>
              <option value="SERVICE_REQUEST">Requisição de serviço</option>
              <option value="QUESTION">Dúvida / informação</option>
              <option value="OTHER">Outro</option>
            </select>
          </div>

          <div>
            <label className={labelClass}>Polo / local</label>
            <select
              className={inputClass}
              value={locationId}
              onChange={(e) => {
                setLocationId(e.target.value);
                setSectorId('');
              }}
            >
              <option value="">Selecione</option>
              {locations.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelClass}>Setor</label>
            <select
              className={inputClass}
              value={sectorId}
              onChange={(e) => setSectorId(e.target.value)}
              disabled={!locationId}
            >
              <option value="">{locationId ? 'Selecione' : 'Escolha um local primeiro'}</option>
              {sectors.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelClass}>Foto (opcional)</label>
            <input
              type="file"
              accept="image/*"
              className={cn(
                inputClass,
                'file:mr-3 file:rounded-md file:border-0 file:bg-primary-50 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-primary-700',
              )}
              onChange={(e) => handleImageChange(e, setSelectedImage, setPreviewUrl)}
            />
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Máximo 5 MB. Formatos de imagem comuns.
            </p>
            {previewUrl && (
              <div className="mt-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previewUrl}
                  alt="Pré-visualização da foto"
                  className="max-h-[200px] max-w-full rounded-lg border border-slate-200 object-contain dark:border-slate-600"
                />
                <button
                  type="button"
                  className={cn(btnSecondary, 'mt-2 border-red-300 text-red-600 dark:border-red-800 dark:text-red-400')}
                  onClick={() => {
                    setSelectedImage(null);
                    setPreviewUrl('');
                  }}
                >
                  Remover foto
                </button>
              </div>
            )}
          </div>

          <button
            type="submit"
            className={cn(btnPrimary, 'w-full sm:w-auto')}
            disabled={loading}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Abrir chamado
          </button>
        </form>
      </div>
    </div>
  );
}
