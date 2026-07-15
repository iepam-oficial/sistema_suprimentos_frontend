'use client';

import { useEffect, useState } from 'react';
import {
  Button,
  FormControl,
  FormLabel,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Select,
  Textarea,
  useToast,
} from '@chakra-ui/react';
import type { CreateEventPayload, EventType } from '@/features/events/types';
import { createEvent } from '@/features/events/api/eventApi';
import {
  combineDateInputAndTime,
  EVENT_TYPE_OPTIONS,
  toDateInputValue,
} from '@/features/events/lib/eventPresentation';

interface EventFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
}

function defaultForm() {
  const today = new Date();
  return {
    title: '',
    description: '',
    type: 'REUNIAO' as EventType,
    startDate: toDateInputValue(today),
    endDate: toDateInputValue(today),
    startTime: '09:00',
    endTime: '18:00',
    location: '',
    room: '',
  };
}

export function EventFormModal({ isOpen, onClose, onCreated }: EventFormModalProps) {
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (isOpen) {
      setForm(defaultForm());
    }
  }, [isOpen]);

  const resetAndClose = () => {
    setForm(defaultForm());
    onClose();
  };

  const handleSubmit = async () => {
    if (!form.title.trim() || !form.description.trim()) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha título e descrição.',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      const startIso = combineDateInputAndTime(form.startDate, form.startTime);
      const endIso = combineDateInputAndTime(form.endDate, form.endTime);

      if (new Date(endIso).getTime() < new Date(startIso).getTime()) {
        toast({
          title: 'Datas inválidas',
          description: 'A data e horário de fim devem ser iguais ou posteriores ao início.',
          status: 'warning',
          duration: 4000,
          isClosable: true,
        });
        return;
      }

      const payload: CreateEventPayload = {
        title: form.title.trim(),
        description: form.description.trim(),
        type: form.type,
        start_date: startIso,
        end_date: endIso,
        start_time: form.startTime,
        location: form.location.trim() || 'Local não especificado',
        room: form.room.trim() || undefined,
        is_public: false,
      };

      setSaving(true);
      const token = localStorage.getItem('@ti-assistant:token');
      if (!token) throw new Error('Token não encontrado');
      await createEvent(token, payload);

      toast({
        title: 'Sucesso',
        description: 'Evento criado com sucesso.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      resetAndClose();
      onCreated();
    } catch (error) {
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Não foi possível criar o evento.',
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={resetAndClose} size="lg" scrollBehavior="inside">
      <ModalOverlay backdropFilter="blur(4px)" />
      <ModalContent>
        <ModalHeader>Novo evento</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <FormControl mb={4} isRequired>
            <FormLabel>Título</FormLabel>
            <Input
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="Ex.: Treinamento de Brigada"
            />
          </FormControl>
          <FormControl mb={4} isRequired>
            <FormLabel>Descrição</FormLabel>
            <Textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Descreva o evento"
              rows={3}
            />
          </FormControl>
          <FormControl mb={4} isRequired>
            <FormLabel>Tipo</FormLabel>
            <Select
              value={form.type}
              onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as EventType }))}
            >
              {EVENT_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </Select>
          </FormControl>
          <FormControl mb={4} isRequired>
            <FormLabel>Data início</FormLabel>
            <Input
              type="date"
              value={form.startDate}
              onChange={(e) => {
                const startDate = e.target.value;
                setForm((f) => ({
                  ...f,
                  startDate,
                  endDate: f.endDate < startDate ? startDate : f.endDate,
                }));
              }}
            />
          </FormControl>
          <FormControl mb={4} isRequired>
            <FormLabel>Data fim</FormLabel>
            <Input
              type="date"
              value={form.endDate}
              min={form.startDate}
              onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
            />
          </FormControl>
          <FormControl mb={4} isRequired>
            <FormLabel>Horário início</FormLabel>
            <Input
              type="time"
              value={form.startTime}
              onChange={(e) => setForm((f) => ({ ...f, startTime: e.target.value }))}
            />
          </FormControl>
          <FormControl mb={4} isRequired>
            <FormLabel>Horário fim</FormLabel>
            <Input
              type="time"
              value={form.endTime}
              onChange={(e) => setForm((f) => ({ ...f, endTime: e.target.value }))}
            />
          </FormControl>
          <FormControl mb={4}>
            <FormLabel>Local</FormLabel>
            <Input
              value={form.location}
              onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
              placeholder="Auditório Principal"
            />
          </FormControl>
          <FormControl mb={4}>
            <FormLabel>Sala / complemento</FormLabel>
            <Input
              value={form.room}
              onChange={(e) => setForm((f) => ({ ...f, room: e.target.value }))}
              placeholder="Opcional"
            />
          </FormControl>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={resetAndClose}>
            Cancelar
          </Button>
          <Button colorScheme="blue" onClick={handleSubmit} isLoading={saving}>
            Salvar
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
