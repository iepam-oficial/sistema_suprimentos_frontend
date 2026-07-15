import React from 'react';
import {
  Flex,
  Heading,
  InputGroup,
  InputLeftElement,
  Input,
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
} from '@chakra-ui/react';
import { SearchIcon, TimerIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useFilters } from '@/contexts/GlobalContext';
import { useColorModeValue } from '@chakra-ui/react';
import type { InventoryItem } from '@/features/inventory/types';

interface InventoryTabProps {
  inventoryItems: InventoryItem[];
  onAllocateItem: (item: InventoryItem) => void;
}

export function InventoryTab({ inventoryItems, onAllocateItem }: InventoryTabProps) {
  const router = useRouter();
  const { colorMode } = useColorMode();
  const [isMobile] = useMediaQuery('(max-width: 768px)');
  const { searchQuery, setSearchQuery } = useFilters();
  const bgColor = useColorModeValue('white', 'gray.800');

  return (
    <>
      {!isMobile && (
      <InputGroup mb={6}>
        <InputLeftElement pointerEvents="none">
          <SearchIcon color={colorMode === 'dark' ? 'gray.400' : 'gray.300'} />
        </InputLeftElement>
        <Input
          placeholder="Buscar itens do inventário..."
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
        {inventoryItems.map((item) => (
          <Card
            key={item.id}
            bg={bgColor}
            backdropFilter="blur(12px)"
            borderWidth="1px"
            borderColor={colorMode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}
            cursor="pointer"
            onClick={() => router.push(`/supply-requests/inventory/${item.id}`)}
            _hover={{ bg: colorMode === 'dark' ? 'rgba(45, 55, 72, 0.6)' : 'rgba(255, 255, 255, 0.6)', transform: 'translateY(-2px)', transition: 'all 0.2s ease-in-out' }}
            borderRadius={{ base: 0, md: 'md' }}
          >
            <CardBody p={{ base: 0, md: 4 }}>
              <VStack align="stretch" spacing={{ base: 2, md: 4 }} p={{ base: 2, md: 0 }}>
                <Image src={item.image_url || "/placeholder.png"} alt={item.name} borderRadius={{ base: 0, md: "md" }} height={{ base: '120px', md: '200px' }} width="100%" objectFit="contain" />
                <Heading size={{ base: 'sm', md: 'md' }} color={colorMode === 'dark' ? 'white' : 'gray.800'} noOfLines={1}>{item.name}</Heading>
                <Text color={colorMode === 'dark' ? 'gray.300' : 'gray.500'} noOfLines={2} fontSize={{ base: 'xs', md: 'sm' }}>{item.description}</Text>
                <HStack hidden={isMobile} justify="space-between">
                  <Badge colorScheme="blue">{item.category.label}</Badge>
                </HStack>
                <Text fontSize={{ base: 'xs', md: 'sm' }} color={colorMode === 'dark' ? 'gray.300' : 'gray.500'}>Status: Disponível</Text>
                <Button 
                  colorScheme="purple" 
                  leftIcon={<TimerIcon size={isMobile ? 16 : 20} />} 
                  onClick={(e) => { e.stopPropagation(); onAllocateItem(item); }} 
                  bg={colorMode === 'dark' ? 'rgba(159, 122, 234, 0.8)' : undefined} 
                  _hover={{ bg: colorMode === 'dark' ? 'rgba(159, 122, 234, 0.9)' : undefined, transform: 'translateY(-1px)' }} 
                  transition="all 0.3s ease" 
                  size={{ base: 'xs', md: 'md' }} 
                  w="full"
                >
                  {isMobile ? 'Alocar' : 'Alocar Item'}
                </Button>
              </VStack>
            </CardBody>
          </Card>
        ))}
      </Grid>
    </>
  );
} 