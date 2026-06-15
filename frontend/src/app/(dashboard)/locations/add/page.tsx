'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Button,
  Container,
  FormControl,
  FormLabel,
  Input,
  VStack,
  useToast,
  Heading,
  HStack,
} from '@chakra-ui/react';
import { createLocation } from '@/features/reference-data';

export default function AddLocationPage() {
  const router = useRouter();
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      name: String(formData.get('name') ?? ''),
      address: String(formData.get('address') ?? ''),
      branch: String(formData.get('branch') ?? ''),
    };

    try {
      const token = localStorage.getItem('@ti-assistant:token');
      if (!token) {
        throw new Error('Token não encontrado');
      }

      await createLocation(token, data);

      toast({
        title: 'Localização adicionada com sucesso!',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      router.push('/locations');
    } catch (error) {
      toast({
        title: 'Erro ao adicionar localização',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      console.error('Erro:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container maxW="container.xl" py={8}>
      <Box bg="white" p={6} rounded="lg" shadow="sm">
        <Heading size="lg" mb={6}>Adicionar Nova Localização</Heading>
        
        <form onSubmit={handleSubmit}>
          <VStack spacing={4}>
            <FormControl isRequired>
              <FormLabel>Nome</FormLabel>
              <Input
                name="name"
                placeholder="Ex: Matriz"
              />
            </FormControl>

            <FormControl isRequired>
              <FormLabel>Endereço</FormLabel>
              <Input
                name="address"
                placeholder="Ex: Rua Principal, 123"
              />
            </FormControl>

            <FormControl isRequired>
              <FormLabel>Filial</FormLabel>
              <Input
                name="branch"
                placeholder="Ex: Filial 1"
              />
            </FormControl>

            <HStack spacing={4} w="full" justify="flex-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                colorScheme="blue"
                isLoading={isLoading}
              >
                Adicionar Localização
              </Button>
            </HStack>
          </VStack>
        </form>
      </Box>
    </Container>
  );
} 