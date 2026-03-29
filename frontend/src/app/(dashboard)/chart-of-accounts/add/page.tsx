'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Button,
  Card,
  CardBody,
  CardHeader,
  FormControl,
  FormLabel,
  Heading,
  Input,
  SimpleGrid,
  VStack,
  useToast,
  Select,
} from '@chakra-ui/react';

export default function AddChartOfAccountPage() {
  const [formData, setFormData] = useState({
    codigo: '',
    nome: '',
    tipo: '' as 'ATIVO' | 'PASSIVO' | 'PATRIMONIO' | 'RECEITA' | 'DESPESA' | '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const toast = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const token = localStorage.getItem('@ti-assistant:token');
      if (!token) {
        throw new Error('Token não encontrado');
      }

      const response = await fetch('/api/chart-of-accounts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || errorData.message || 'Erro ao criar plano de conta');
      }

      toast({
        title: 'Plano de conta criado com sucesso',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      router.push('/chart-of-accounts');
    } catch (error: any) {
      toast({
        title: 'Erro ao criar plano de conta',
        description: error.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box p={4}>
      <VStack spacing={4} align="stretch">
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Heading size="lg">Adicionar Plano de Conta</Heading>
          <Button variant="outline" onClick={() => router.push('/chart-of-accounts')}>
            Voltar
          </Button>
        </Box>

        <Card>
          <CardHeader>
            <Heading size="md">Informações do Plano de Conta</Heading>
          </CardHeader>
          <CardBody>
            <form onSubmit={handleSubmit}>
              <VStack spacing={4}>
                <SimpleGrid columns={2} spacing={4} width="100%">
                  <FormControl isRequired>
                    <FormLabel>Código</FormLabel>
                    <Input
                      value={formData.codigo}
                      onChange={(e) =>
                        setFormData({ ...formData, codigo: e.target.value })
                      }
                      placeholder="Ex: 1.2.3.005"
                    />
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel>Tipo</FormLabel>
                    <Select
                      value={formData.tipo}
                      onChange={(e) =>
                        setFormData({ ...formData, tipo: e.target.value as any })
                      }
                      placeholder="Selecione o tipo"
                    >
                      <option value="ATIVO">ATIVO</option>
                      <option value="PASSIVO">PASSIVO</option>
                      <option value="PATRIMONIO">PATRIMONIO</option>
                      <option value="RECEITA">RECEITA</option>
                      <option value="DESPESA">DESPESA</option>
                    </Select>
                  </FormControl>

                  <FormControl isRequired gridColumn="1 / -1">
                    <FormLabel>Nome</FormLabel>
                    <Input
                      value={formData.nome}
                      onChange={(e) =>
                        setFormData({ ...formData, nome: e.target.value })
                      }
                      placeholder="Nome do plano de conta"
                    />
                  </FormControl>
                </SimpleGrid>

                <Box display="flex" justifyContent="flex-end" width="100%">
                  <Button 
                    colorScheme="blue" 
                    type="submit"
                    isLoading={isLoading}
                  >
                    Salvar
                  </Button>
                </Box>
              </VStack>
            </form>
          </CardBody>
        </Card>
      </VStack>
    </Box>
  );
}

