'use client';

import { useState, useEffect } from 'react';
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
import {
  fetchLocationById,
  updateLocation,
  type LocationDTO,
} from '@/features/reference-data';

export default function EditLocationPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [location, setLocation] = useState<LocationDTO | null>(null);

  useEffect(() => {
    const fetchLocation = async () => {
      try {
        const token = localStorage.getItem('@ti-assistant:token');
        if (!token) {
          throw new Error('Token não encontrado');
        }

        const data = await fetchLocationById(token, params.id);
        setLocation(data);
      } catch (error) {
        toast({
          title: 'Erro ao carregar localização',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        console.error('Erro:', error);
      }
    };

    fetchLocation();
  }, [params.id, toast]);

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

      await updateLocation(token, params.id, data);

      toast({
        title: 'Localização atualizada com sucesso!',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      router.push('/locations');
    } catch (error) {
      toast({
        title: 'Erro ao atualizar localização',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      console.error('Erro:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!location) {
    return null;
  }

  return (
    <Container maxW="container.xl" py={8}>
      <Box bg="white" p={6} rounded="lg" shadow="sm">
        <Heading size="lg" mb={6}>Editar Localização</Heading>
        
        <form onSubmit={handleSubmit}>
          <VStack spacing={4}>
            <FormControl isRequired>
              <FormLabel>Nome</FormLabel>
              <Input
                name="name"
                defaultValue={location.name}
                placeholder="Ex: Matriz"
              />
            </FormControl>

            <FormControl isRequired>
              <FormLabel>Endereço</FormLabel>
              <Input
                name="address"
                defaultValue={location.address}
                placeholder="Ex: Rua Principal, 123"
              />
            </FormControl>

            <FormControl isRequired>
              <FormLabel>Filial</FormLabel>
              <Input
                name="branch"
                defaultValue={location.branch}
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
                Salvar Alterações
              </Button>
            </HStack>
          </VStack>
        </form>
      </Box>
    </Container>
  );
} 