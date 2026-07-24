'use client';

import {
  Badge,
  Box,
  Button,
  Flex,
  HStack,
  IconButton,
  Input,
  InputGroup,
  InputLeftElement,
  Tooltip,
  useColorMode,
} from '@chakra-ui/react';
import { Filter, Plus, SearchIcon } from 'lucide-react';

export interface PurchaseRequestToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  filtersActive: boolean;
  onOpenFilters: () => void;
  onNewRequest: () => void;
  showNewRequest?: boolean;
}

export function PurchaseRequestToolbar({
  search,
  onSearchChange,
  filtersActive,
  onOpenFilters,
  onNewRequest,
  showNewRequest = true,
}: PurchaseRequestToolbarProps) {
  const { colorMode } = useColorMode();
  const inputBg = colorMode === 'dark' ? 'rgba(45, 55, 72, 0.5)' : 'rgba(255, 255, 255, 0.5)';
  const inputBorder =
    colorMode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';

  return (
    <Flex justify="space-between" align="center" gap={2} flexWrap="wrap" flexShrink={0}>
      <HStack spacing={2} flex="1" minW="180px">
        <InputGroup maxW="320px" flex="1" size="sm">
          <InputLeftElement pointerEvents="none" h="full">
            <SearchIcon size={16} color={colorMode === 'dark' ? '#A0AEC0' : '#CBD5E0'} />
          </InputLeftElement>
          <Input
            placeholder="Buscar por código, justificativa ou item"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            bg={inputBg}
            borderColor={inputBorder}
            _hover={{ borderColor: colorMode === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)' }}
            _focus={{ borderColor: colorMode === 'dark' ? 'blue.400' : 'blue.500', boxShadow: 'none' }}
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
              onClick={onOpenFilters}
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
      {showNewRequest && (
        <Button
          size="sm"
          leftIcon={<Plus size={16} />}
          colorScheme="blue"
          flexShrink={0}
          onClick={onNewRequest}
        >
          Nova solicitação
        </Button>
      )}
    </Flex>
  );
}
