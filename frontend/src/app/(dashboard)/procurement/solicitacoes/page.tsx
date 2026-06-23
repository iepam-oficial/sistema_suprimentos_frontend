'use client';

import { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Divider,
  Flex,
  Heading,
  useColorModeValue,
  useDisclosure,
  useMediaQuery,
  useToast,
  VStack,
} from '@chakra-ui/react';
import { Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import {
  PurchaseRequestForm,
  PurchaseRequestList,
  usePurchaseRequests,
} from '@/features/procurement';

const ALLOWED_ROLES = ['COORDINATOR', 'ADMIN'];

export default function PurchaseRequestsPage() {
  const router = useRouter();
  const toast = useToast();
  const [isMobile] = useMediaQuery('(max-width: 768px)');
  const { isOpen: isFormOpen, onOpen: openForm, onClose: closeForm } = useDisclosure();
  const [authorized, setAuthorized] = useState(false);
  const { items, loading, error, reload } = usePurchaseRequests();

  const bgColor = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const headingColor = useColorModeValue('gray.800', 'white');

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('@ti-assistant:user') || '{}');
    if (!user?.role || !ALLOWED_ROLES.includes(user.role)) {
      router.push('/unauthorized');
      return;
    }
    setAuthorized(true);
  }, [router]);

  useEffect(() => {
    if (error) {
      toast({
        title: 'Erro ao carregar solicitações',
        description: error,
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    }
  }, [error, toast]);

  const handleFormSuccess = () => {
    closeForm();
    reload();
  };

  if (!authorized) {
    return null;
  }

  return (
    <Box w="full" h="full">
      <VStack
        spacing={4}
        align="stretch"
        bg={bgColor}
        p={{ base: 2, md: 6 }}
        borderRadius="lg"
        boxShadow="sm"
        borderWidth="1px"
        borderColor={borderColor}
        h="full"
      >
        {!isMobile && (
          <>
            <Flex justify="space-between" align="center" gap={3}>
              <Heading size="lg" color={headingColor}>
                Solicitações de Compra
              </Heading>
              {!isFormOpen && (
                <Button leftIcon={<Plus size={18} />} colorScheme="blue" onClick={openForm}>
                  Nova solicitação
                </Button>
              )}
            </Flex>
            <Divider />
          </>
        )}

        {isMobile && !isFormOpen && (
          <Button leftIcon={<Plus size={18} />} colorScheme="blue" onClick={openForm} size="sm">
            Nova solicitação
          </Button>
        )}

        {isFormOpen && (
          <Box>
            <Heading size="md" mb={4} color={headingColor}>
              Nova solicitação de compra
            </Heading>
            <PurchaseRequestForm onSuccess={handleFormSuccess} onCancel={closeForm} />
            <Divider my={6} />
          </Box>
        )}

        <PurchaseRequestList items={items} loading={loading} />
      </VStack>
    </Box>
  );
}
