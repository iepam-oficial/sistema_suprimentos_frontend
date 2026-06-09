'use client'

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Heading,
  Text,
  Spinner,
  VStack,
  Badge,
  Button,
  Flex,
  Image,
  useMediaQuery,
  Container,
  HStack,
  IconButton,
  useColorModeValue,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  useDisclosure,
  Card,
  CardBody,
  Grid,
  GridItem,
  Divider,
  Stack
} from '@chakra-ui/react';
import { ArrowLeft, MapPin, Calendar, Tag, Hash, Building } from 'lucide-react';
import { fetchInventoryItemById } from '@/features/inventory/api/inventoryApi';
import { InventoryAllocationModal } from '@/components/InventoryAllocationModal';
import { allocateInventoryItem } from '../../utils/requestUtils';
import { formatBRL } from '@/utils/money';

export default function InventoryDetailPage({ params }: { params: { id: string } }) {
  const [item, setItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const [isMobile] = useMediaQuery('(max-width: 768px)');
  // Cores
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const cardBg = useColorModeValue('gray.50', 'gray.700');
  const headingColor = useColorModeValue('gray.800', 'white');
  const subHeadingColor = useColorModeValue('gray.600', 'gray.300');
  const buttonHoverBg = useColorModeValue('gray.100', 'gray.700');
  const mainBg = useColorModeValue('gray.50', 'gray.900');
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [isAllocating, setIsAllocating] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('@ti-assistant:token');
        if (!token) throw new Error('Token não encontrado');
        const data = await fetchInventoryItemById(params.id, token);
        setItem(data);
      } catch (err: any) {
        setError(err.message || 'Erro ao buscar item do inventário');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [params.id]);

  const handleAllocationSubmit = async (data: { return_date: string; destination: string; notes: string }) => {
    setIsAllocating(true);
    try {
      const token = localStorage.getItem('@ti-assistant:token');
      if (!token) throw new Error('Token não encontrado');
      await allocateInventoryItem(
        item.id,
        data.return_date,
        data.destination,
        data.notes,
        token
      );
      onClose();
      window.location.reload();
    } catch (err: any) {
      alert(err.message || 'Erro ao criar alocação');
    } finally {
      setIsAllocating(false);
    }
  };

  if (loading) {
    return (
      <Flex justify="center" align="center" minH="400px">
        <VStack spacing={4}>
          <Spinner size="xl" color="blue.500" thickness="4px" />
          <Text color="gray.500">Carregando detalhes do item...</Text>
        </VStack>
      </Flex>
    );
  }

  if (error) {
    return (
      <Container maxW="container.sm" py={8}>
        <VStack spacing={4} textAlign="center">
          <Text color="red.500" fontSize="lg">{error}</Text>
          <Button onClick={() => router.back()} colorScheme="blue">
            Voltar
          </Button>
        </VStack>
      </Container>
    );
  }

  if (!item) {
    return null;
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  return (
    <Box minH="100vh" bg={mainBg} py={isMobile ? "7vh" : 6}>
      <Container maxW="container.xl">
        <VStack spacing={6} align="stretch">
          {/* Header */}
          <Flex justify="space-between" align="center">
            <HStack spacing={4}>
          <IconButton
            aria-label="Voltar"
                icon={<ArrowLeft size={24} />}
            variant="ghost"
            onClick={() => router.back()}
                size="lg"
                _hover={{ bg: buttonHoverBg }}
          />
              <VStack align="start" spacing={1}>
                <Heading size="lg" color={headingColor}>
                  Detalhes do Item
                </Heading>
                <Text color="gray.500" fontSize="sm">
                  Informações completas do item do inventário
                </Text>
              </VStack>
        </HStack>
          </Flex>

          {/* Main Content */}
          <Grid templateColumns={{ base: '1fr', lg: '1fr 1fr' }} gap={8}>
            {/* Image Section */}
            <GridItem>
              <Card bg={bgColor} borderWidth="1px" borderColor={borderColor} overflow="hidden">
                <CardBody p={0}>
          <Image
            src={item.image_url || '/placeholder.png'}
            alt={item.name}
                    width="100%"
                    height="500px"
                    objectFit="contain"
                    fallbackSrc="/placeholder.png"
                  />
                </CardBody>
              </Card>
            </GridItem>

            {/* Details Section */}
            <GridItem>
              <VStack spacing={6} align="stretch">
                {/* Title and Status */}
                <Card bg={bgColor} borderWidth="1px" borderColor={borderColor}>
                  <CardBody>
                    <VStack spacing={4} align="stretch">
                      <Heading size="lg" color={headingColor}>
                        {item.name}
                      </Heading>
                      <Text color={subHeadingColor} fontSize="md" lineHeight="1.6">
                        {item.description}
                      </Text>
                      <HStack spacing={3}>
                        <Badge 
                          colorScheme="green" 
                          size="lg"
                          px={4}
                          py={2}
                          borderRadius="full"
                        >
                          Disponível
                        </Badge>
                        <Badge colorScheme="blue" size="lg" px={4} py={2} borderRadius="full">
                          {item.category?.label}
            </Badge>
                      </HStack>
                    </VStack>
                  </CardBody>
                </Card>

                {/* Technical Details */}
                <Card bg={bgColor} borderWidth="1px" borderColor={borderColor}>
                  <CardBody>
                    <VStack spacing={4} align="stretch">
                      <Heading size="md" color={headingColor}>
                        Informações Técnicas
                      </Heading>
                      <Grid templateColumns="1fr 1fr" gap={4}>
                        <VStack align="start" spacing={2}>
                          <HStack>
                            <Tag size={16} color="gray.500" />
                            <Text fontSize="sm" color="gray.500">Modelo</Text>
                          </HStack>
                          <Text fontWeight="medium">{item.model}</Text>
                        </VStack>
                        <VStack align="start" spacing={2}>
                          <HStack>
                            <Hash size={16} color="gray.500" />
                            <Text fontSize="sm" color="gray.500">Nº Série</Text>
                          </HStack>
                          <Text fontWeight="medium" fontFamily="mono">{item.serial_number}</Text>
                        </VStack>
                        <VStack align="start" spacing={2}>
                          <HStack>
                            <Calendar size={16} color="gray.500" />
                            <Text fontSize="sm" color="gray.500">Data de Aquisição</Text>
                          </HStack>
                          <Text fontWeight="medium">{formatDate(item.acquisition_date)}</Text>
                        </VStack>
                        <VStack align="start" spacing={2}>
                          <HStack>
                            <Building size={16} color="gray.500" />
                            <Text fontSize="sm" color="gray.500">Localização</Text>
                          </HStack>
                          <Text fontWeight="medium">{item.location?.name || '-'}</Text>
                        </VStack>
                      </Grid>
                    </VStack>
                  </CardBody>
                </Card>

                {/* Financial Details */}
                <Card bg={bgColor} borderWidth="1px" borderColor={borderColor}>
                  <CardBody>
                    <VStack spacing={4} align="stretch">
                      <Heading size="md" color={headingColor}>
                        Informações Financeiras
                      </Heading>
                      <Grid templateColumns="1fr 1fr" gap={4}>
                        <VStack align="start" spacing={2}>
                          <Text fontSize="sm" color="gray.500">Valor de Aquisição</Text>
                          <Text fontWeight="bold" color="green.600" fontSize="lg">
                            {formatBRL(item.acquisition_price)}
                          </Text>
                        </VStack>
                        <VStack align="start" spacing={2}>
                          <Text fontSize="sm" color="gray.500">Valor Residual</Text>
                          <Text fontWeight="medium" color="blue.600">
                            {formatBRL(item.residual_value)}
                          </Text>
                        </VStack>
                        <VStack align="start" spacing={2}>
                          <Text fontSize="sm" color="gray.500">Vida Útil</Text>
                          <Text fontWeight="medium">{item.service_life} anos</Text>
                        </VStack>
                        <VStack align="start" spacing={2}>
                          <Text fontSize="sm" color="gray.500">Finalidade</Text>
                          <Text fontWeight="medium" textTransform="capitalize">
                            {item.finality?.toLowerCase().replace('_', ' ')}
                          </Text>
                        </VStack>
                      </Grid>
                    </VStack>
                  </CardBody>
                </Card>

                {/* Action Button */}
                <Button
                  colorScheme="blue"
                  size="lg"
                  height="60px"
                  fontSize="lg"
                  fontWeight="bold"
                  onClick={onOpen}
                  _hover={{ transform: 'translateY(-2px)', boxShadow: 'lg' }}
                  transition="all 0.2s"
                >
                Alocar Item
              </Button>
              </VStack>
            </GridItem>
          </Grid>
          </VStack>

        <InventoryAllocationModal
          isOpen={isOpen}
          onClose={onClose}
          item={item}
          onSubmit={handleAllocationSubmit}
          isLoading={isAllocating}
        />
      </Container>
    </Box>
  );
} 