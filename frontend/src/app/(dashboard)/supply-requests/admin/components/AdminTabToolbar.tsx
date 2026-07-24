'use client';

import {
    Box,
    Badge,
    Flex,
    HStack,
    IconButton,
    Input,
    InputGroup,
    InputLeftElement,
    Tooltip,
    VStack,
    useColorMode,
} from '@chakra-ui/react';
import { FiSearch } from 'react-icons/fi';
import { Filter } from 'lucide-react';

interface AdminTabToolbarProps {
    searchValue: string;
    onSearchChange: (value: string) => void;
    searchPlaceholder: string;
    filtersActive: boolean;
    onFilterOpen: () => void;
    actions: React.ReactNode;
    isMobile?: boolean;
}

export function AdminTabToolbar({
    searchValue,
    onSearchChange,
    searchPlaceholder,
    filtersActive,
    onFilterOpen,
    actions,
    isMobile = false,
}: AdminTabToolbarProps) {
    const { colorMode } = useColorMode();

    const inputBg = colorMode === 'dark' ? 'rgba(45, 55, 72, 0.5)' : 'rgba(255, 255, 255, 0.5)';
    const inputBorder = colorMode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';

    if (isMobile) {
        return (
            <VStack spacing={2} align="stretch">
                <HStack spacing={2}>
                    <InputGroup flex="1" size="sm">
                        <InputLeftElement pointerEvents="none" h="full">
                            <FiSearch color={colorMode === 'dark' ? 'gray.400' : 'gray.300'} />
                        </InputLeftElement>
                        <Input
                            placeholder={searchPlaceholder}
                            value={searchValue}
                            onChange={(e) => onSearchChange(e.target.value)}
                            bg={inputBg}
                            borderColor={inputBorder}
                            _hover={{ borderColor: colorMode === 'dark' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)' }}
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
                <HStack spacing={1} flexWrap="wrap" justify="flex-end">
                    {actions}
                </HStack>
            </VStack>
        );
    }

    return (
        <Flex justify="space-between" align="center" gap={2} flexWrap="wrap">
            <HStack spacing={2} flex="1" minW="180px">
                <InputGroup maxW="320px" flex="1" size="sm">
                    <InputLeftElement pointerEvents="none" h="full">
                        <FiSearch color={colorMode === 'dark' ? 'gray.400' : 'gray.300'} />
                    </InputLeftElement>
                    <Input
                        placeholder={searchPlaceholder}
                        value={searchValue}
                        onChange={(e) => onSearchChange(e.target.value)}
                        bg={inputBg}
                        borderColor={inputBorder}
                        _hover={{ borderColor: colorMode === 'dark' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)' }}
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
            <HStack spacing={1} flexShrink={0}>
                {actions}
            </HStack>
        </Flex>
    );
}
