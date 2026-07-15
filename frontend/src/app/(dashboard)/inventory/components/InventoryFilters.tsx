import React from 'react';
import {
  Input,
  InputGroup,
  InputLeftElement,
  Select,
  VStack,
  HStack,
  Drawer,
  DrawerOverlay,
  DrawerContent,
  DrawerHeader,
  DrawerBody,
  DrawerCloseButton,
  DrawerFooter,
  FormControl,
  FormLabel,
  Button,
  IconButton,
  Tooltip,
  Box,
  Badge,
  Text,
  useBreakpointValue,
  useColorMode,
  useColorModeValue,
} from '@chakra-ui/react';
import { FiSearch } from 'react-icons/fi';
import { Filter } from 'lucide-react';

interface InventoryFiltersProps {
  searchTerm: string;
  setSearchTerm: (v: string) => void;
  selectedCategory: string;
  setSelectedCategory: (v: string) => void;
  selectedSubcategory: string;
  setSelectedSubcategory: (v: string) => void;
  categories: { id: string; label: string }[];
  subcategories: { id: string; label: string }[];
  isFilterOpen: boolean;
  onFilterOpen: () => void;
  onFilterClose: () => void;
  handleCategoryChange: (id: string) => void;
}

export const InventoryFilters: React.FC<InventoryFiltersProps> = ({
  searchTerm,
  setSearchTerm,
  selectedCategory,
  setSelectedCategory,
  selectedSubcategory,
  setSelectedSubcategory,
  categories,
  subcategories,
  isFilterOpen,
  onFilterOpen,
  onFilterClose,
  handleCategoryChange,
}) => {
  const isMobile = useBreakpointValue({ base: true, md: false });
  const { colorMode } = useColorMode();

  const drawerBg = useColorModeValue('white', 'gray.800');
  const drawerBorder = useColorModeValue('gray.200', 'gray.600');
  const textColor = useColorModeValue('gray.800', 'white');
  const inputBg = useColorModeValue('white', 'gray.700');
  const inputBorder = useColorModeValue('gray.200', 'gray.600');

  const filtersActive = Boolean(selectedCategory || selectedSubcategory);

  const clearFilters = () => {
    setSelectedCategory('');
    setSelectedSubcategory('');
    handleCategoryChange('');
  };

  return (
    <>
      <HStack spacing={2} w={isMobile ? 'full' : undefined}>
        <InputGroup size="sm" flex={isMobile ? 1 : undefined} maxW={isMobile ? undefined : '400px'}>
          <InputLeftElement pointerEvents="none" h="full">
            <FiSearch color={colorMode === 'dark' ? 'gray.400' : 'gray.300'} />
          </InputLeftElement>
          <Input
            placeholder={
              isMobile
                ? 'Buscar item...'
                : 'Buscar por nome, modelo ou número de série...'
            }
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            bg={inputBg}
            borderColor={inputBorder}
          />
        </InputGroup>
        <Tooltip label="Filtros">
          <Box position="relative">
            <IconButton
              aria-label="Filtros"
              icon={<Filter size={16} />}
              size="sm"
              variant="ghost"
              colorScheme="blue"
              onClick={onFilterOpen}
            />
            {filtersActive && (
              <Badge
                position="absolute"
                top="-1"
                right="-1"
                borderRadius="full"
                boxSize="2.5"
                colorScheme="blue"
                p={0}
              />
            )}
          </Box>
        </Tooltip>
      </HStack>

      <Drawer
        isOpen={isFilterOpen}
        placement={isMobile ? 'bottom' : 'right'}
        onClose={onFilterClose}
        size={isMobile ? undefined : 'sm'}
      >
        <DrawerOverlay />
        <DrawerContent
          bg={drawerBg}
          borderTopRadius={isMobile ? 'xl' : undefined}
          borderLeft={isMobile ? undefined : '1px solid'}
          borderColor={drawerBorder}
        >
          <DrawerCloseButton />
          <DrawerHeader
            color={textColor}
            borderBottom="1px solid"
            borderColor={drawerBorder}
          >
            <HStack spacing={2}>
              <Filter size={20} />
              <Text>Filtros</Text>
            </HStack>
          </DrawerHeader>
          <DrawerBody py={4}>
            <VStack spacing={4} pt={isMobile ? 0 : 4} align="stretch">
              <FormControl>
                <FormLabel color={textColor} fontSize="sm">
                  Categoria
                </FormLabel>
                <Select
                  placeholder="Todas as categorias"
                  value={selectedCategory}
                  onChange={(e) => {
                    setSelectedCategory(e.target.value);
                    handleCategoryChange(e.target.value);
                  }}
                  bg={inputBg}
                  borderColor={inputBorder}
                  size="sm"
                >
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.label}
                    </option>
                  ))}
                </Select>
              </FormControl>
              <FormControl>
                <FormLabel color={textColor} fontSize="sm">
                  Subcategoria
                </FormLabel>
                <Select
                  placeholder="Todas as subcategorias"
                  value={selectedSubcategory}
                  onChange={(e) => setSelectedSubcategory(e.target.value)}
                  isDisabled={!selectedCategory}
                  bg={inputBg}
                  borderColor={inputBorder}
                  size="sm"
                >
                  {subcategories.map((subcategory) => (
                    <option key={subcategory.id} value={subcategory.id}>
                      {subcategory.label}
                    </option>
                  ))}
                </Select>
              </FormControl>
            </VStack>
          </DrawerBody>
          <DrawerFooter borderTop="1px solid" borderColor={drawerBorder}>
            <Button
              variant="outline"
              size="sm"
              w="full"
              onClick={clearFilters}
              isDisabled={!filtersActive}
            >
              Limpar filtros
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </>
  );
};
