import { useEffect, useState } from 'react';
import {
  VStack,
  Spinner,
  useToast,
  Image,
  Flex,
  Text
} from '@chakra-ui/react';
import { useRouter } from 'next/navigation';
import { ReturnItemModal } from '@/app/(dashboard)/supply-requests/components/ReturnItemModal';
import { AllocationCard } from '@/app/(dashboard)/supply-requests/components/AllocationCard';
import type { InventoryAllocation } from '@/features/inventory/types';

export function MobileMyAllocationsPage() {
  const [allocations, setAllocations] = useState<InventoryAllocation[]>([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();
  const router = useRouter();
  const [returnModalOpen, setReturnModalOpen] = useState(false);
  const [returningAllocation, setReturningAllocation] = useState<InventoryAllocation | null>(null);
  const [lostModalOpen, setLostModalOpen] = useState(false);
  const [lostAllocation, setLostAllocation] = useState<InventoryAllocation | null>(null);

  useEffect(() => {
    fetchAllocations();
  }, []);

  const fetchAllocations = async () => {
    try {
      const token = localStorage.getItem('@ti-assistant:token');
      if (!token) {
        router.push('/');
        return;
      }
      const response = await fetch('/api/inventory-allocations', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Erro ao carregar alocações');
      const data = await response.json();
      setAllocations(data);
    } catch (error) {
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao carregar alocações',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmDelivery = async (allocationId: string) => {
    try {
      const token = localStorage.getItem('@ti-assistant:token');
      if (!token) {
        router.push('/login');
        return;
      }
      const response = await fetch(`/api/inventory-allocations/${allocationId}/delivery-confirmation`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ confirmation: true })
      });
      if (!response.ok) throw new Error('Erro ao confirmar entrega');
      toast({
        title: 'Sucesso',
        description: 'Entrega confirmada com sucesso',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      fetchAllocations();
    } catch (error) {
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao confirmar entrega',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleReturnItem = async (notes: string) => {
    if (!returningAllocation) return;
    try {
      const token = localStorage.getItem('@ti-assistant:token');
      if (!token) throw new Error('Token não encontrado');
      const response = await fetch(`/api/inventory-allocations/${returningAllocation.id}/return`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ return_notes: notes })
      });
      if (!response.ok) throw new Error('Erro ao devolver item');
      toast({ title: 'Sucesso', description: 'Item devolvido com sucesso', status: 'success', duration: 3000, isClosable: true });
      fetchAllocations();
    } catch (error) {
      throw error;
    }
  };

  const handleMarkAsLost = async (notes: string) => {
    if (!lostAllocation) return;
    try {
      const token = localStorage.getItem('@ti-assistant:token');
      if (!token) throw new Error('Token não encontrado');
      const response = await fetch(`/api/inventory-allocations/${lostAllocation.id}/mark-lost`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ lost_notes: notes })
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || 'Erro ao marcar item como perdido');
      }
      toast({ title: 'Sucesso', description: 'Item marcado como perdido', status: 'success', duration: 3000, isClosable: true });
      fetchAllocations();
    } catch (error) {
      throw error;
    }
  };

  if (loading) {
    return (
      <Flex justify="center" align="center" minH="200px">
        <Spinner size="xl" />
      </Flex>
    );
  }

  if (allocations.length === 0) {
    return (
      <VStack spacing={4} py={8} align="center">
        <Image src="/Task-complete.svg" alt="Nenhuma alocação encontrada" maxW="200px" mb={2} />
        <Text color="gray.500" fontSize="lg">Nenhuma alocação encontrada</Text>
      </VStack>
    );
  }

  // Ordenar: pendentes de confirmação do requerente primeiro
  const sortedAllocations = [...allocations].sort((a, b) => {
    const aPending = a.status === 'APPROVED' && !a.requester_delivery_confirmation;
    const bPending = b.status === 'APPROVED' && !b.requester_delivery_confirmation;
    if (aPending && !bPending) return -1;
    if (!aPending && bPending) return 1;
    return 0;
  });

  return (
    <VStack spacing={4} align="stretch">
      {sortedAllocations.map((allocation) => (
        <AllocationCard
          key={allocation.id}
          allocation={allocation}
          onConfirmDelivery={handleConfirmDelivery}
          onReturnItem={(allocation) => {
            setReturningAllocation(allocation);
            setReturnModalOpen(true);
          }}
          onMarkAsLost={(allocation) => {
            setLostAllocation(allocation);
            setLostModalOpen(true);
          }}
        />
      ))}
      <ReturnItemModal
        isOpen={returnModalOpen}
        onClose={() => {
          setReturnModalOpen(false);
          setReturningAllocation(null);
        }}
        onConfirm={handleReturnItem}
        title="Devolver Item"
        itemName={returningAllocation ? `${returningAllocation.inventory.name} - ${returningAllocation.inventory.model}` : undefined}
      />
      <ReturnItemModal
        isOpen={lostModalOpen}
        onClose={() => {
          setLostModalOpen(false);
          setLostAllocation(null);
        }}
        onConfirm={handleMarkAsLost}
        title="Marcar como perdido"
        confirmLabel="Confirmar"
        placeholder="Descreva as circunstâncias da perda..."
        colorScheme="purple"
        itemName={lostAllocation ? `${lostAllocation.inventory.name} - ${lostAllocation.inventory.model}` : undefined}
      />
    </VStack>
  );
} 