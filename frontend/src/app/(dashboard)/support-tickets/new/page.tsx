'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Heading,
  useToast,
  VStack,
  Textarea,
  Select,
  Spinner,
  Flex,
  Image,
  Text,
  useColorModeValue,
} from '@chakra-ui/react';
import { ArrowLeft } from 'lucide-react';
import { uploadImage, handleImageChange } from '@/utils/imageUtils';
import { canCreateSupportTicket, SupportTicketKind } from '../types';

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
  const toast = useToast();
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

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
          toast({
            title: 'Arquivo inválido',
            description: 'Selecione uma imagem (JPEG, PNG, etc.).',
            status: 'error',
            duration: 4000,
            isClosable: true,
          });
          setLoading(false);
          return;
        }
        if (selectedImage.size > MAX_IMAGE_BYTES) {
          toast({
            title: 'Imagem muito grande',
            description: 'O tamanho máximo é 5 MB.',
            status: 'error',
            duration: 4000,
            isClosable: true,
          });
          setLoading(false);
          return;
        }
        try {
          imageUrl = await uploadImage(selectedImage);
        } catch (uploadError: unknown) {
          toast({
            title: 'Erro no upload',
            description:
              uploadError instanceof Error
                ? uploadError.message
                : 'Não foi possível enviar a imagem.',
            status: 'error',
            duration: 5000,
            isClosable: true,
          });
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
      toast({ title: 'Chamado criado', status: 'success', duration: 3000 });
      router.push(`/support-tickets/${created.id}`);
    } catch (err: unknown) {
      toast({
        title: 'Erro',
        description: err instanceof Error ? err.message : 'Erro ao criar chamado',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  if (bootLoading) {
    return (
      <Flex justify="center" align="center" minH="200px" p={8}>
        <Spinner size="xl" />
      </Flex>
    );
  }

  return (
    <Box p={{ base: 4, md: 8 }} maxW="720px" mx="auto">
      <Button
        variant="ghost"
        leftIcon={<ArrowLeft size={18} />}
        mb={4}
        onClick={() => router.push('/support-tickets')}
      >
        Voltar
      </Button>
      <Box
        as="form"
        onSubmit={handleSubmit}
        bg={cardBg}
        p={6}
        borderRadius="md"
        borderWidth={1}
        borderColor={borderColor}
      >
        <Heading size="md" mb={6}>
          Novo chamado
        </Heading>
        <VStack spacing={4} align="stretch">
          <FormControl isRequired>
            <FormLabel>Assunto</FormLabel>
            <Input value={subject} onChange={(e) => setSubject(e.target.value)} />
          </FormControl>
          <FormControl isRequired>
            <FormLabel>Descrição</FormLabel>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={6} />
          </FormControl>
          <FormControl>
            <FormLabel>Prioridade</FormLabel>
            <Select value={priority} onChange={(e) => setPriority(e.target.value)}>
              <option value="LOW">Baixa</option>
              <option value="MEDIUM">Média</option>
              <option value="HIGH">Alta</option>
              <option value="URGENT">Urgente</option>
            </Select>
          </FormControl>
          <FormControl isRequired>
            <FormLabel>Tipo de chamado</FormLabel>
            <Select value={ticketType} onChange={(e) => setTicketType(e.target.value as SupportTicketKind)}>
              <option value="INCIDENT">Incidente</option>
              <option value="SERVICE_REQUEST">Requisição de serviço</option>
              <option value="QUESTION">Dúvida / informação</option>
              <option value="OTHER">Outro</option>
            </Select>
          </FormControl>
          <FormControl>
            <FormLabel>Polo / local</FormLabel>
              <Select
                placeholder="Selecione"
                value={locationId}
                onChange={(e) => {
                  setLocationId(e.target.value);
                  setSectorId('');
                }}
              >
              {locations.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </Select>
          </FormControl>
          <FormControl>
            <FormLabel>Setor</FormLabel>
            <Select
              placeholder={locationId ? 'Selecione' : 'Escolha um local primeiro'}
              value={sectorId}
              onChange={(e) => setSectorId(e.target.value)}
              isDisabled={!locationId}
            >
              {sectors.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
          </FormControl>
          <FormControl>
            <FormLabel>Foto (opcional)</FormLabel>
            <Input
              type="file"
              accept="image/*"
              onChange={(e) => handleImageChange(e, setSelectedImage, setPreviewUrl)}
            />
            <Text fontSize="xs" color="gray.500" mt={1}>
              Máximo 5 MB. Formatos de imagem comuns.
            </Text>
            {previewUrl && (
              <Box mt={3}>
                <Image
                  src={previewUrl}
                  alt="Pré-visualização da foto"
                  maxH="200px"
                  borderRadius="md"
                  objectFit="contain"
                />
                <Button
                  size="sm"
                  variant="ghost"
                  colorScheme="red"
                  mt={2}
                  onClick={() => {
                    setSelectedImage(null);
                    setPreviewUrl('');
                  }}
                >
                  Remover foto
                </Button>
              </Box>
            )}
          </FormControl>
          <Button type="submit" colorScheme="blue" isLoading={loading} mt={2}>
            Abrir chamado
          </Button>
        </VStack>
      </Box>
    </Box>
  );
}
