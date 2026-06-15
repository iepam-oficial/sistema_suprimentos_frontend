import {
  Card,
  CardBody,
  VStack,
  HStack,
  Text,
  Badge,
  Button
} from '@chakra-ui/react';
import { CheckCircle } from 'lucide-react';
import type { InventoryAllocation } from '@/features/inventory/types';

interface AllocationCardProps {
  allocation: InventoryAllocation;
  onConfirmDelivery: (allocationId: string) => Promise<void>;
  onReturnItem: (allocation: InventoryAllocation) => void;
  onMarkAsLost?: (allocation: InventoryAllocation) => void;
}

export function AllocationCard({ 
  allocation, 
  onConfirmDelivery, 
  onReturnItem,
  onMarkAsLost,
}: AllocationCardProps) {
  const getStatusColor = (status: InventoryAllocation['status']) => {
    switch (status) {
      case 'APPROVED': return 'green';
      case 'REJECTED': return 'red';
      case 'DELIVERED': return 'purple';
      case 'RETURNED': return 'blue';
      case 'LOST': return 'purple';
      default: return 'yellow';
    }
  };

  const getStatusText = (status: InventoryAllocation['status']) => {
    switch (status) {
      case 'PENDING': return 'Pendente';
      case 'APPROVED': return 'Aprovado';
      case 'REJECTED': return 'Rejeitado';
      case 'DELIVERED': return 'Entregue';
      case 'RETURNED': return 'Devolvido';
      case 'LOST': return 'Perdido';
      default: return status;
    }
  };

  return (
    <Card variant="outline">
      <CardBody>
        <VStack align="stretch" spacing={2}>
          <HStack justify="space-between">
            <Text fontWeight="bold">{allocation.inventory.name}</Text>
            <Badge colorScheme={getStatusColor(allocation.status)}>
              {getStatusText(allocation.status)}
            </Badge>
          </HStack>
          
          <Text fontSize="sm" color="gray.500">
            Modelo: {allocation.inventory.model}
          </Text>
          
          <Text fontSize="sm" color="gray.500">
            Nº Série: {allocation.inventory.serial_number}
          </Text>
          
          <Text fontSize="sm" color="gray.500">
            Destino: {allocation.destination_name || allocation.destination}
          </Text>
          
          <Text fontSize="sm" color="gray.500">
            Retorno: {allocation.return_date 
              ? new Date(allocation.return_date).toLocaleDateString('pt-BR') 
              : 'Não definida'
            }
          </Text>
          
          <HStack>
            <Badge colorScheme={allocation.requester_delivery_confirmation ? 'green' : 'gray'}>
              Requerente: {allocation.requester_delivery_confirmation ? 'Confirmado' : 'Pendente'}
            </Badge>
            <Badge colorScheme={allocation.manager_delivery_confirmation ? 'green' : 'gray'}>
              Gerente: {allocation.manager_delivery_confirmation ? 'Confirmado' : 'Pendente'}
            </Badge>
          </HStack>
          
          {allocation.status === 'APPROVED' && !allocation.requester_delivery_confirmation && (
            <Button
              leftIcon={<CheckCircle />}
              colorScheme="blue"
              size="sm"
              onClick={() => onConfirmDelivery(allocation.id)}
            >
              Confirmar Recebimento
            </Button>
          )}
          
          {allocation.status === 'DELIVERED' && (
            <>
              <Button
                size="sm"
                colorScheme="blue"
                onClick={() => onReturnItem(allocation)}
              >
                Devolver Item
              </Button>
              {onMarkAsLost && (
                <Button
                  size="sm"
                  colorScheme="purple"
                  variant="outline"
                  onClick={() => onMarkAsLost(allocation)}
                >
                  Marcar como perdido
                </Button>
              )}
            </>
          )}
        </VStack>
      </CardBody>
    </Card>
  );
} 