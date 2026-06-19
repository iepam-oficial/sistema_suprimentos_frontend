"use client";

import { useEffect, useState } from "react";
import {
  Box,
  Heading,
  Spinner,
  VStack,
  Text,
  Badge,
  HStack,
  useToast,
  IconButton,
  Button,
  Card,
  CardBody,
  Divider,
} from "@chakra-ui/react";
import { ArrowLeft, CheckCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { SupplyRequest } from "../types";
import { loadMyRequests } from "../utils/myRequestsUtils";
import { handleRequesterConfirmation } from "../utils/requestUtils";

export default function MyRequestsPage() {
  const [requests, setRequests] = useState<SupplyRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();
  const router = useRouter();

  const loadRequests = async () => {
    try {
      const token = localStorage.getItem("@ti-assistant:token");
      if (!token) {
        router.push("/");
        return;
      }
      const data = await loadMyRequests(token);
      setRequests(data);
    } catch (error) {
      toast({
        title: "Erro",
        description:
          error instanceof Error
            ? error.message
            : "Erro ao buscar requisições",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, [router, toast]);

  const handleConfirmDelivery = async (requestId: string) => {
    try {
      const token = localStorage.getItem("@ti-assistant:token");
      if (!token) {
        router.push("/");
        return;
      }

      await handleRequesterConfirmation(requestId, true, token);
      
      toast({
        title: "Sucesso",
        description: "Entrega confirmada com sucesso",
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      loadRequests();
    } catch (error) {
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao confirmar entrega",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  return (
    <Box p={4} maxW="md" mx="auto">
      <HStack mb={4}>
        <IconButton
          aria-label="Voltar"
          icon={<ArrowLeft />}
          variant="ghost"
          onClick={() => router.back()}
        />
        <Heading size="md">Minhas Requisições</Heading>
      </HStack>
      {loading ? (
        <Spinner size="lg" />
      ) : requests.length === 0 ? (
        <Text>Nenhuma requisição encontrada.</Text>
      ) : (
        <VStack spacing={4} align="stretch">
          {requests.map((req: SupplyRequest) => (
            <Card
              key={req.id}
              variant="outline"
              _hover={{
                transform: 'translateY(-2px)',
                transition: 'all 0.2s ease-in-out',
              }}
            >
              <CardBody>
                <VStack align="stretch" spacing={3}>
                  <HStack justify="space-between">
                    <Text fontWeight="bold">
                      {req.supply?.name}
                    </Text>
                    <Badge colorScheme={
                      (() => {
                        switch (req.status) {
                          case "PENDING":
                            return "yellow";
                          case "APPROVED":
                            return "blue";
                          case "REJECTED":
                            return "red";
                          case "CANCELLED":
                            return "red";
                          case "DELIVERED":
                            return "green";
                          default:
                            return "yellow";
                        }
                      })()
                    }>
                      {(() => {
                        switch (req.status) {
                          case "PENDING":
                            return "Pendente";
                          case "APPROVED":
                            return "Aprovado";
                          case "REJECTED":
                            return "Rejeitado";
                          case "CANCELLED":
                            return "Cancelado";
                          case "DELIVERED":
                            return "Entregue";
                          default:
                            return req.status;
                        }
                      })()}
                    </Badge>
                  </HStack>

                  <Text fontSize="sm" color="gray.500">
                    {req.supply?.description}
                  </Text>

                  <HStack justify="space-between">
                    <Text fontSize="sm">
                      Quantidade: {req.quantity} {req.supply?.unit?.symbol || req.supply?.unit?.name}
                    </Text>
                    <Text fontSize="sm" color="gray.500">
                      {new Date(req.created_at).toLocaleDateString('pt-BR')}
                    </Text>
                  </HStack>

                  {req.delivery_deadline && (
                    <Text fontSize="sm" color="gray.500">
                      Entrega até: {new Date(req.delivery_deadline).toLocaleDateString()}
                    </Text>
                  )}

                  {req.destination && (
                    <Text fontSize="sm" color="gray.500">
                      Destino: {req.destination}
                    </Text>
                  )}

                  <Divider />

                  <VStack spacing={2} align="start">
                    <HStack>
                      <Text fontSize="sm">Requerente:</Text>
                      <Badge colorScheme={req.requester_confirmation ? 'green' : 'gray'}>
                        {req.requester_confirmation ? 'Confirmado' : 'Pendente'}
                      </Badge>
                    </HStack>
                    <HStack>
                      <Text fontSize="sm">Gerente:</Text>
                      <Badge colorScheme={req.manager_delivery_confirmation ? 'green' : 'gray'}>
                        {req.manager_delivery_confirmation ? 'Confirmado' : 'Pendente'}
                      </Badge>
                    </HStack>
                  </VStack>

                  {req.status === "APPROVED" && !req.requester_confirmation && (
                    <Button
                      leftIcon={<CheckCircle />}
                      colorScheme="blue"
                      size="sm"
                      onClick={() => handleConfirmDelivery(req.id)}
                    >
                      Confirmar Recebimento
                    </Button>
                  )}
                </VStack>
              </CardBody>
            </Card>
          ))}
        </VStack>
      )}
    </Box>
  );
} 