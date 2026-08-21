'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { uploadImage } from '@/features/images/api/imageApi';
import { handleImageChange } from '@/utils/imageUtils';
import {
  CreateSupportTicketInput,
  PriorityLevel,
  ROLES_TICKETS_CREATE,
  SupportTicketKind,
} from '@/features/support-tickets/types';
import { assertPageAccess, resolveUserRoles } from '@/utils/pageAccess';
import {
  createSupportTicket,
  RateLimitError,
} from '@/features/support-tickets/api/supportTicketApi';
import { cardClass, inputClass, labelClass, btnPrimary, btnSecondary } from '@/components/support-desk/formClasses';
import { cn } from '@/components/support-desk/cn';
import {
  fetchLocations,
  fetchSectorsByLocation,
  type LocationDTO,
  type SectorDTO,
} from '@/features/reference-data';
import { fetchMe } from '@/features/identity';

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export default function NewSupportTicketPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [bootLoading, setBootLoading] = useState(true);
  const [locations, setLocations] = useState<LocationDTO[]>([]);
  const [sectors, setSectors] = useState<SectorDTO[]>([]);

  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<PriorityLevel>('MEDIUM');
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
    const user = JSON.parse(userRaw) as { roles?: string[]; role?: string };
    const access = assertPageAccess(resolveUserRoles(user), ROLES_TICKETS_CREATE);
    if (!access.allowed) {
      router.push(access.redirectTo);
      return;
    }

    const load = async () => {
      const [locResult, meResult] = await Promise.allSettled([
        fetchLocations(token),
        fetchMe(token),
      ]);
      const locData = locResult.status === 'fulfilled' ? locResult.value : [];
      const me = meResult.status === 'fulfilled' ? meResult.value : null;
      const userLocation = me?.sector?.location;
      const locationsList =
        userLocation && !locData.some((l) => l.id === userLocation.id)
          ? [{ id: userLocation.id, name: userLocation.name, branch: userLocation.branch }, ...locData]
          : locData;
      setLocations(locationsList);
      if (userLocation?.id) {
        setLocationId(userLocation.id);
      }
      if (me?.sector?.id) {
        setSectorId(me.sector.id);
      }
    };
    load().finally(() => setBootLoading(false));
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
        const secData = await fetchSectorsByLocation(token, locationId);
        if (!cancelled) setSectors(secData);
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
          const uploaded = await uploadImage(selectedImage);
          imageUrl = uploaded.key;
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

      const body: CreateSupportTicketInput = {
        subject: subject.trim(),
        description: description.trim(),
        priority,
        ticket_type: ticketType,
        ...(locationId ? { location_id: locationId } : {}),
        ...(sectorId ? { sector_id: sectorId } : {}),
        ...(imageUrl ? { image_url: imageUrl } : {}),
      };

      const created = await createSupportTicket(token, body);
      toast.success('Chamado criado');
      router.push(`/support-tickets/${created.id}`);
    } catch (err: unknown) {
      if (err instanceof RateLimitError) {
        router.push('/rate-limit');
        return;
      }
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
            <select
              className={inputClass}
              value={priority}
              onChange={(e) => setPriority(e.target.value as PriorityLevel)}
            >
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
