import React from 'react';
import {
  Flex,
  Heading,
  Grid,
  Card,
  CardBody,
  VStack,
  HStack,
  Badge,
  Text,
  Button,
  Image,
  useColorMode,
  useMediaQuery,
  InputGroup,
  InputLeftElement,
  Input,
  Box,
  useColorModeValue,
} from '@chakra-ui/react';
import { ShoppingCart, SearchIcon, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Supply } from '../../types';
import { useFilters } from '@/contexts/GlobalContext';
import { formatBRL } from '@/utils/money';

interface CatalogTabProps {
  supplies: Supply[];
  onAddToCart: (supply: Supply) => void;
  onOpenCustomRequestModal?: () => void;
}

export function CatalogTab({ supplies, onAddToCart, onOpenCustomRequestModal }: CatalogTabProps) {
  const router = useRouter();
  const { colorMode } = useColorMode();
  const [isMobile] = useMediaQuery('(max-width: 768px)');
  const { searchQuery, setSearchQuery } = useFilters();
  
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  return (
    <>
      {/* Remover o botão do desktop, manter só no mobile */}
      {onOpenCustomRequestModal && isMobile && (
        <Flex mb={6} justify="center">
          <Button
            colorScheme="blue"
            leftIcon={<Plus size={18} />}
            onClick={onOpenCustomRequestModal}
            w="full"
            boxShadow="sm"
            fontWeight="medium"
            fontSize="md"
            borderRadius="lg"
            transition="all 0.2s"
            _hover={{
              bg: 'blue.600',
              color: 'white',
              transform: 'translateY(-2px)',
              boxShadow: 'md',
            }}
          >
            Pedido Customizado
          </Button>
        </Flex>
      )}
      {!isMobile && (
      <InputGroup mb={6}>
        <InputLeftElement pointerEvents="none">
            <SearchIcon size={20} color={colorMode === 'dark' ? 'gray.400' : 'gray.300'} />
        </InputLeftElement>
        <Input
          placeholder="Buscar suprimentos..."
          value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          bg={colorMode === 'dark' ? 'rgba(45, 55, 72, 0.5)' : 'gray.50'}
          backdropFilter="blur(12px)"
          borderColor={colorMode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}
          _hover={{ borderColor: colorMode === 'dark' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)' }}
          _focus={{ borderColor: colorMode === 'dark' ? 'blue.400' : 'blue.500', boxShadow: 'none' }}
        />
      </InputGroup>
      )}
      
      <Grid templateColumns={{ base: 'repeat(2, 1fr)', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }} gap={{ base: 0, md: 6 }}>
        {supplies.map((supply) => (
          <Card
            key={supply.id}
            bg={colorMode === 'dark' ? 'rgba(45, 55, 72, 0.5)' : 'gray.50'}
            backdropFilter="blur(12px)"
            borderWidth="1px"
            borderColor={colorMode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}
            cursor="pointer"
            onClick={() => router.push(`/supply-requests/${supply.id}`)}
            _hover={{ bg: colorMode === 'dark' ? 'rgba(45, 55, 72, 0.6)' : 'rgba(255, 255, 255, 0.6)', transform: 'translateY(-2px)', transition: 'all 0.2s ease-in-out' }}
            borderRadius={{ base: 0, md: 'md' }}
          >
            <CardBody p={{ base: 0, md: 4 }}>
              <VStack align="stretch" spacing={{ base: 2, md: 4 }} p={{ base: 2, md: 0 }}>
                <Image 
                  src={supply.image_url || '/placeholder.png'} 
                  alt={supply.name} 
                  borderRadius={{ base: 0, md: "md" }} 
                  height={{ base: '120px', md: '200px' }} 
                  width="100%" 
                  objectFit="contain"
                  fallbackSrc="/placeholder.png"
                />
                <Heading size={{ base: 'sm', md: 'md' }} color={colorMode === 'dark' ? 'white' : 'gray.800'} noOfLines={1}>
                  {supply.name}
                </Heading>
                <Text color={colorMode === 'dark' ? 'gray.300' : 'gray.500'} noOfLines={2} fontSize={{ base: 'xs', md: 'sm' }}>
                  {supply.description}
                </Text>
                <HStack hidden={isMobile} justify="space-between">
                  <Badge colorScheme="blue">{supply.category.label}</Badge>
                </HStack>
                <Text fontSize={{ base: 'xs', md: 'sm' }} color={colorMode === 'dark' ? 'gray.300' : 'gray.500'}>
                  {formatBRL(supply.unit_price)}
                </Text>
                <Button 
                  colorScheme="blue" 
                  leftIcon={<ShoppingCart size={isMobile ? 16 : 20} />} 
                  onClick={(e) => { e.stopPropagation(); onAddToCart(supply); }} 
                  isDisabled={supply.quantity <= 0} 
                  bg={colorMode === 'dark' ? 'rgba(66, 153, 225, 0.8)' : undefined} 
                  _hover={{ bg: colorMode === 'dark' ? 'rgba(66, 153, 225, 0.9)' : undefined, transform: 'translateY(-1px)' }} 
                  transition="all 0.3s ease" 
                  size={{ base: 'xs', md: 'md' }} 
                  w="full"
                >
                  {isMobile ? 'Adicionar' : 'Adicionar ao Carrinho'}
                </Button>
              </VStack>
            </CardBody>
          </Card>
        ))}
      </Grid>
    </>
  );
} 