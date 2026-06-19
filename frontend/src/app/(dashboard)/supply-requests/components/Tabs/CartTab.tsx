import React from 'react';
import {
  Card,
  CardBody,
  VStack,
  HStack,
  Heading,
  Text,
  Button,
  IconButton,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  useColorMode,
  useMediaQuery,
  Badge,
  Divider,
  Box,
} from '@chakra-ui/react';
import { ShoppingCart, Trash2, Package } from 'lucide-react';
import { Supply } from '../../types';

interface CartItem {
  id: string;
  quantity: number;
  supply: Supply;
}

interface CartTabProps {
  cart: CartItem[];
  onRemoveFromCart: (supplyId: string) => void;
  onUpdateQuantity: (supplyId: string, quantity: number) => void;
  onOpenModal: () => void;
  onContinueShopping: () => void;
}

export function CartTab({ cart, onRemoveFromCart, onUpdateQuantity, onOpenModal, onContinueShopping }: CartTabProps) {
  const { colorMode } = useColorMode();
  const [isMobile] = useMediaQuery('(max-width: 768px)');

  // Calcular total de itens
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <Card bg={colorMode === 'dark' ? 'rgba(45, 55, 72, 0.5)' : 'gray.50'} backdropFilter="blur(12px)" borderWidth="1px" borderColor={colorMode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}>
      <CardBody>
        <VStack spacing={4}>
          {cart.length === 0 ? (
            <VStack spacing={4} py={8}>
              <ShoppingCart size={isMobile ? 40 : 48} color={colorMode === 'dark' ? '#A0AEC0' : '#718096'} />
              <Text fontSize="sm" color={colorMode === 'dark' ? 'gray.400' : 'gray.600'} textAlign="center">
                Adicione itens do catálogo para fazer seu pedido
              </Text>
              <Button 
                colorScheme="blue"
                onClick={onContinueShopping}
                bg={colorMode === 'dark' ? 'rgba(66, 153, 225, 0.8)' : undefined}
                _hover={{ bg: colorMode === 'dark' ? 'rgba(66, 153, 225, 0.9)' : undefined, transform: 'translateY(-1px)' }} 
                transition="all 0.3s ease"
                size={isMobile ? 'md' : 'lg'}
                w={isMobile ? 'full' : 'auto'}
              >
                Continuar Comprando
              </Button>
            </VStack>
          ) : (
            <>
              {/* Resumo do carrinho */}
              <Card bg={colorMode === 'dark' ? 'rgba(45, 55, 72, 0.3)' : 'white'} borderWidth="1px" borderColor={colorMode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'} borderRadius={0}>
                <CardBody p={4}>
                  <HStack justify="space-between" align="center">
                    <HStack spacing={3}>
                      <Package size={isMobile ? 20 : 24} color={colorMode === 'dark' ? '#A0AEC0' : '#718096'} />
                      <VStack align="start" spacing={0}>
                        <Text fontSize="sm" color={colorMode === 'dark' ? 'gray.300' : 'gray.600'}>
                          {cart.length} {cart.length === 1 ? 'item' : 'itens'} no carrinho
                        </Text>
                        <Text fontSize="lg" fontWeight="bold" color={colorMode === 'dark' ? 'white' : 'gray.800'}>
                          {totalItems} {totalItems === 1 ? 'unidade' : 'unidades'}
                        </Text>
                      </VStack>
                    </HStack>
                  </HStack>
                </CardBody>
              </Card>

              {/* Lista de itens */}
              <VStack spacing={3} align="stretch" w="full">
              {cart.map((item) => (
                item.supply ? (
                    <Card key={item.id} bg={colorMode === 'dark' ? 'rgba(45, 55, 72, 0.5)' : 'gray.50'} backdropFilter="blur(12px)" borderWidth="1px" borderColor={colorMode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'} borderRadius={0}>
                      <CardBody p={4}>
                        <VStack align="stretch" spacing={3}>
                          {/* Header com nome e botão remover */}
                          <HStack justify="space-between" align="start">
                            <VStack align="start" spacing={1} flex="1">
                              <Heading size="sm" color={colorMode === 'dark' ? 'white' : 'gray.800'} noOfLines={2}>
                                {item.supply.name}
                              </Heading>
                              <Text color={colorMode === 'dark' ? 'gray.300' : 'gray.500'} noOfLines={2} fontSize="xs">
                                {item.supply.description}
                              </Text>
                              {item.supply.category && (
                                <Badge colorScheme="blue" size="sm" variant="subtle">
                                  {item.supply.category?.label}
                                </Badge>
                              )}
                          </VStack>
                          <IconButton 
                            aria-label="Remover item" 
                              icon={<Trash2 size={16} />} 
                            colorScheme="red" 
                            variant="ghost" 
                              size="sm" 
                            onClick={() => onRemoveFromCart(item.id)} 
                          />
                        </HStack>

                          <Divider />

                          {/* Informações do item */}
                          <VStack align="stretch" spacing={2}>
                        <HStack justify="space-between">
                              <Text fontSize="sm" color={colorMode === 'dark' ? 'gray.300' : 'gray.500'}>
                                Quantidade:
                              </Text>
                          <NumberInput 
                            value={item.quantity} 
                            min={1} 
                            max={item.supply.available_quantity} 
                            onChange={(_, value) => onUpdateQuantity(item.id, value)} 
                                size="sm" 
                                maxW="100px"
                          >
                            <NumberInputField 
                              bg={colorMode === 'dark' ? 'rgba(45, 55, 72, 0.5)' : 'gray.50'} 
                              backdropFilter="blur(12px)" 
                              borderColor={colorMode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'} 
                              _hover={{ borderColor: colorMode === 'dark' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)' }} 
                              _focus={{ borderColor: colorMode === 'dark' ? 'blue.400' : 'blue.500', boxShadow: 'none' }} 
                            />
                            <NumberInputStepper>
                              <NumberIncrementStepper />
                              <NumberDecrementStepper />
                            </NumberInputStepper>
                          </NumberInput>
                        </HStack>

                            <HStack justify="space-between">
                              <Text fontSize="sm" color={colorMode === 'dark' ? 'gray.300' : 'gray.500'}>
                                Unidade:
                              </Text>
                              <Text fontSize="sm" color={colorMode === 'dark' ? 'white' : 'gray.800'} fontWeight="medium">
                                {item.supply.unit?.symbol || item.supply.unit?.name || 'un'}
                              </Text>
                            </HStack>

                          </VStack>
                      </VStack>
                    </CardBody>
                  </Card>
                ) : null
              ))}
              </VStack>

              {/* Botão finalizar */}
              <Box pt={2}>
              <Button 
                colorScheme="green" 
                  size="lg" 
                onClick={onOpenModal} 
                  leftIcon={<ShoppingCart size={20} />} 
                bg={colorMode === 'dark' ? 'rgba(72, 187, 120, 0.8)' : undefined} 
                _hover={{ bg: colorMode === 'dark' ? 'rgba(72, 187, 120, 0.9)' : undefined, transform: 'translateY(-1px)' }} 
                transition="all 0.3s ease"
                  w="full"
                  height="50px"
                  fontSize="md"
                  fontWeight="bold"
              >
                  Finalizar Pedido
              </Button>
              </Box>
            </>
          )}
        </VStack>
      </CardBody>
    </Card>
  );
} 